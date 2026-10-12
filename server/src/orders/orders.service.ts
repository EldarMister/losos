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
import { DEFAULT_FREE_KIT_ITEMS, freeKitItemsForRegion } from "../catalog/cart-configuration";
import type { OrderKitItem } from "./order-kit";
import { aggregateProductKitItems, ProductKitValidationError } from "../catalog/product-kit";

export function fingerprintRequest(dto: CreateOrderDto, legacyKitItems?: OrderKitItem[]) {
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
    kitItems: legacyKitItems ?? (dto.kitItems
      ? dto.kitItems.map(({ id, quantity }) => ({ id, quantity })).sort((left, right) => left.id.localeCompare(right.id))
      : null),
    items,
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; driverError?: { code?: string } };
  return candidate.code === "23505" || candidate.driverError?.code === "23505";
}

function publicOrder(order: Order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
    status: order.status,
    posStatus: order.posStatus,
    posSyncStatus: order.posSyncStatus,
    posProgress: {
      itemsTotal: order.posItemsTotal,
      itemsReady: order.posItemsReady,
      itemsRejected: order.posItemsRejected,
    },
  };
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
    const regionSlug = dto.regionSlug || "bishkek";
    const requestFingerprint = fingerprintRequest(dto);

    const existing = await this.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return publicOrder(this.ensureMatchingIdempotency(existing, requestFingerprint, dto));
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
          return this.ensureMatchingIdempotency(concurrentExisting, requestFingerprint, dto);
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
            return items.create({
              ...priced,
              categoryName: product.category.title,
              naktaCoins: 0,
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

        let includedKitItems: OrderKitItem[];
        try {
          includedKitItems = aggregateProductKitItems(
            dto.items.map((entry) => ({ quantity: entry.quantity, kitItems: byId.get(entry.productId)!.kitItems })),
            freeKitItemsForRegion(products[0].category.region.freeKitItems),
          ).map(({ id, name, quantity }) => ({ id, name, quantity }));
        } catch (error) {
          if (error instanceof ProductKitValidationError) throw new BadRequestException(error.message);
          throw error;
        }
        const kitItems = normalizeOrderKitItems(dto.kitItems, includedKitItems);

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
          includedKitItems,
          idempotencyKey,
          requestFingerprint,
          externalOrderId: `NAKTA-${idempotencyKey}`,
          subtotal,
          total: subtotal,
          status: OrderStatus.NEW,
          adminConfirmedAt: null,
          items: lines,
        });
        const saved = await orders.save(order);
        // Transactional outbox: consumers cannot see this stable event until
        // the order transaction commits. Retried checkout emits no second event.
        // BIGSERIAL alone does not follow commit order. Serialize this short
        // final step until commit so an SSE cursor never skips a slower order.
        await manager.query("SELECT pg_advisory_xact_lock(1785011, 0)");
        await manager.query(`INSERT INTO admin_order_events (id, "orderId", "orderNumber", "regionSlug")
          VALUES ($1, $2, $3, $4) ON CONFLICT ("orderId") DO NOTHING`,
        [randomUUID(), saved.id, saved.orderNumber, saved.regionSlug]);
        return saved;
      });
      this.logger.log(`Order ${created.id} persisted as new (idempotency ${idempotencyKey})`);
      return publicOrder(created);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const racedOrder = await this.findByIdempotencyKey(idempotencyKey);
      if (!racedOrder) throw error;
      this.logger.warn(`Recovered concurrent order ${racedOrder.id} (idempotency ${idempotencyKey})`);
      return publicOrder(this.ensureMatchingIdempotency(racedOrder, requestFingerprint, dto));
    }
  }

  private findByIdempotencyKey(idempotencyKey: string) {
    return this.orders.findOne({
      where: { idempotencyKey },
      relations: { items: true },
    });
  }

  private ensureMatchingIdempotency(order: Order, requestFingerprint: string, dto: CreateOrderDto) {
    if (order.requestFingerprint !== requestFingerprint) {
      // Orders created before per-dish kits used the resolved kit snapshot in the fingerprint.
      const legacyItems = order.includedKitItems ?? order.kitItems ?? [];
      try {
        const legacyIds = new Set(legacyItems.map((item) => item.id));
        const quantities = new Map<string, number>();
        for (const item of dto.kitItems ?? []) {
          if (!legacyIds.has(item.id) || quantities.has(item.id) || !Number.isInteger(item.quantity) || item.quantity < 0 || item.quantity > 20) {
            throw new Error("Invalid legacy kit selection");
          }
          quantities.set(item.id, item.quantity);
        }
        // Submitted legacy quantities reconstruct the original request even when
        // the administrator reduced the saved kit before this migration.
        const legacyFingerprint = fingerprintRequest(dto, legacyItems.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: quantities.get(item.id) ?? item.quantity,
        })));
        if (order.requestFingerprint === legacyFingerprint) return order;
        if (dto.kitItems === undefined || dto.kitItems === null) {
          const knownDefaults = new Map(DEFAULT_FREE_KIT_ITEMS.map((item) => [item.id, item.defaultQuantity]));
          const defaultFingerprint = fingerprintRequest(dto, legacyItems.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: knownDefaults.get(item.id) ?? item.quantity,
          })));
          if (order.requestFingerprint === defaultFingerprint) return order;
        }
      } catch {
        // A different kit selection remains an idempotency conflict.
      }
      throw new ConflictException("Idempotency key was already used for another order");
    }
    return order;
  }
}
