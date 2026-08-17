import { BadRequestException, ConflictException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, randomUUID } from "node:crypto";
import { In, Repository } from "typeorm";
import { PhoneAuthService } from "../auth/phone-auth.service";
import { Product } from "../catalog/product.entity";
import { Region } from "../catalog/region.entity";
import { regionContentSourceSlug } from "../catalog/region-content-source";
import { EduPosService } from "../edu-pos/edu-pos.service";
import { isDeliveryOpenAt } from "../catalog/delivery-hours";
import { POSTGRES_INTEGER_MAX } from "../common/numeric-limits";
import { CreateOrderDto } from "./create-order.dto";
import { OrderItem } from "./order-item.entity";
import { Order } from "./order.entity";
import { DeliveryType, OrderStatus, PaymentMethod } from "./order.enums";
import { OrderPricingError, priceOrderLine } from "./order-pricing";
import { normalizeOrderKitItems } from "./order-kit";

function fingerprintRequest(dto: CreateOrderDto) {
  const items = (dto.items ?? []).map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    modifiers: [...(item.modifiers ?? [])]
      .map((modifier) => ({
        groupId: modifier.groupId,
        itemId: modifier.itemId,
        quantity: modifier.quantity ?? 1,
      }))
      .sort((left, right) =>
        `${left.groupId}:${left.itemId}`.localeCompare(`${right.groupId}:${right.itemId}`)),
  })).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  const kitItems = normalizeOrderKitItems(dto.kitItems);
  const canonical = {
    regionSlug: dto.regionSlug || "bishkek",
    deliveryType: dto.deliveryType || DeliveryType.DELIVERY,
    customerName: dto.customerName,
    phone: dto.phone,
    address: dto.address,
    latitude: dto.latitude ?? null,
    longitude: dto.longitude ?? null,
    apartment: dto.apartment || "",
    entrance: dto.entrance || "",
    floor: dto.floor || "",
    intercom: dto.intercom || "",
    comment: dto.comment || "",
    paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
    utensilsCount: dto.noUtensils ? 0 : (dto.utensilsCount ?? 1),
    noUtensils: dto.noUtensils ?? false,
    kitItems,
    items,
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; driverError?: { code?: string } };
  return candidate.code === "23505" || candidate.driverError?.code === "23505";
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    private readonly phoneAuth: PhoneAuthService,
    private readonly eduPos: EduPosService,
  ) {}

  async create(dto: CreateOrderDto) {
    if (!dto.items?.length) throw new BadRequestException("Order must contain at least one item");
    const idempotencyKey = dto.idempotencyKey || randomUUID();
    const requestFingerprint = fingerprintRequest(dto);
    const kitItems = normalizeOrderKitItems(dto.kitItems);

    const existing = await this.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return this.ensureMatchingIdempotency(existing, requestFingerprint);
    }

    try {
      const created = await this.orders.manager.transaction(async (manager) => {
        const orders = manager.getRepository(Order);
        const items = manager.getRepository(OrderItem);
        const productRepository = manager.getRepository(Product);
        const regionRepository = manager.getRepository(Region);

        const concurrentExisting = await orders.findOne({
          where: { idempotencyKey },
          relations: { items: true },
        });
        if (concurrentExisting) {
          return this.ensureMatchingIdempotency(concurrentExisting, requestFingerprint);
        }

        const ids = [...new Set(dto.items.map((item) => item.productId))];
        const products = await productRepository.find({
          where: { id: In(ids) },
          relations: { category: { region: true } },
        });
        if (products.length !== ids.length) {
          throw new BadRequestException("One or more products do not exist");
        }
        this.eduPos.assertProductsOrderable(products);
        const byId = new Map(products.map((product) => [product.id, product]));
        const regionSlug = dto.regionSlug || "bishkek";
        const orderRegion = await regionRepository.findOne({
          where: { slug: regionSlug, enabled: true },
        });
        if (!orderRegion) throw new BadRequestException(`Region ${regionSlug} is unavailable`);
        const menuRegionSlug = regionContentSourceSlug(orderRegion, "menuSourceRegionSlug");

        const lines = dto.items.map((entry) => {
          const product = byId.get(entry.productId)!;
          if (!product.available) throw new BadRequestException(`${product.name} is unavailable`);
          if (product.category.region.slug !== menuRegionSlug) {
            throw new BadRequestException(`${product.name} is not available in region ${regionSlug}`);
          }
          try {
            const priced = priceOrderLine(product, entry.quantity, entry.modifiers ?? []);
            const modifierNaktaCoins = priced.modifierSnapshots.reduce(
              (total, modifier) => total + modifier.totalNaktaCoins * (
                modifier.priceScope === "per-product" ? entry.quantity : 1
              ),
              0,
            );
            const naktaCoins = product.naktaCoins * entry.quantity + modifierNaktaCoins;
            if (!Number.isSafeInteger(naktaCoins) || naktaCoins > POSTGRES_INTEGER_MAX) {
              throw new BadRequestException("NAKTA Coin для позиции заказа превышает допустимое значение");
            }
            return items.create({
              ...priced,
              naktaCoins,
              posDishId: product.posDishId,
              posVariantId: product.posVariantId,
              posWeightGrams: product.posSoldByWeight && product.weight > 0
                ? Math.round(product.weight)
                : null,
              posStatus: null,
              posReadyQuantity: 0,
              posRejectReason: null,
            });
          } catch (error) {
            if (error instanceof OrderPricingError) throw new BadRequestException(error.message);
            throw error;
          }
        });

        const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
        if (
          !Number.isSafeInteger(subtotal)
          || subtotal > POSTGRES_INTEGER_MAX
        ) {
          throw new BadRequestException("Order total is too large");
        }

        const deliveryType = dto.deliveryType || DeliveryType.DELIVERY;
        if (!isDeliveryOpenAt(orderRegion)) {
          throw new BadRequestException("Кухня сейчас закрыта. Оформить заказ можно в рабочее время.");
        }

        await this.phoneAuth.consumeVerification(dto.phone, dto.verificationToken, manager);

        const order = orders.create({
          regionSlug,
          deliveryType,
          customerName: dto.customerName,
          phone: dto.phone,
          address: dto.address,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          apartment: dto.apartment || "",
          entrance: dto.entrance || "",
          floor: dto.floor || "",
          intercom: dto.intercom || "",
          comment: dto.comment || "",
          paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
          utensilsCount: dto.noUtensils ? 0 : (dto.utensilsCount ?? 1),
          noUtensils: dto.noUtensils ?? false,
          kitItems,
          idempotencyKey,
          requestFingerprint,
          externalOrderId: `NAKTA-${idempotencyKey}`,
          subtotal,
          total: subtotal,
          status: OrderStatus.NEW,
          adminConfirmedAt: null,
          items: lines,
        });
        return orders.save(order);
      });
      this.logger.log(`Order ${created.id} persisted as new (idempotency ${idempotencyKey})`);
      return created;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const racedOrder = await this.findByIdempotencyKey(idempotencyKey);
      if (!racedOrder) throw error;
      this.logger.warn(`Recovered concurrent order ${racedOrder.id} (idempotency ${idempotencyKey})`);
      return this.ensureMatchingIdempotency(racedOrder, requestFingerprint);
    }
  }

  private findByIdempotencyKey(idempotencyKey: string) {
    return this.orders.findOne({
      where: { idempotencyKey },
      relations: { items: true },
    });
  }

  private ensureMatchingIdempotency(order: Order, requestFingerprint: string) {
    if (order.requestFingerprint !== requestFingerprint) {
      throw new ConflictException("Idempotency key was already used for another order");
    }
    return order;
  }
}
