import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, randomUUID } from "node:crypto";
import { In, Repository } from "typeorm";
import { Product } from "../catalog/product.entity";
import { Region } from "../catalog/region.entity";
import { isPointInDeliveryZone } from "../catalog/delivery-zone";
import { POSTGRES_INTEGER_MAX } from "../common/numeric-limits";
import { CreateOrderDto } from "./create-order.dto";
import { OrderItem } from "./order-item.entity";
import { Order } from "./order.entity";
import { DeliveryType, OrderStatus, PaymentMethod } from "./order.enums";
import { OrderPricingError, priceOrderLine } from "./order-pricing";

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
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  async create(dto: CreateOrderDto) {
    if (!dto.items?.length) throw new BadRequestException("Order must contain at least one item");
    const idempotencyKey = dto.idempotencyKey || randomUUID();
    const requestFingerprint = fingerprintRequest(dto);

    const existing = await this.findByIdempotencyKey(idempotencyKey);
    if (existing) return this.ensureMatchingIdempotency(existing, requestFingerprint);

    try {
      return await this.orders.manager.transaction(async (manager) => {
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
        const byId = new Map(products.map((product) => [product.id, product]));
        const regionSlug = dto.regionSlug || "bishkek";
        const region = await regionRepository.findOne({ where: { slug: regionSlug, enabled: true } });
        if (!region) throw new BadRequestException(`Region ${regionSlug} is unavailable`);
        if ((dto.deliveryType || DeliveryType.DELIVERY) === DeliveryType.DELIVERY) {
          if (!Number.isFinite(dto.latitude) || !Number.isFinite(dto.longitude)) {
            throw new BadRequestException("Delivery coordinates are required");
          }
          if (!isPointInDeliveryZone(dto.latitude!, dto.longitude!, region.deliveryZone || [])) {
            throw new BadRequestException("Address is outside the delivery zone");
          }
        }

        const lines = dto.items.map((entry) => {
          const product = byId.get(entry.productId)!;
          if (!product.available) throw new BadRequestException(`${product.name} is unavailable`);
          if (!product.category.region.enabled || product.category.region.slug !== regionSlug) {
            throw new BadRequestException(`${product.name} is not available in region ${regionSlug}`);
          }
          try {
            const priced = priceOrderLine(product, entry.quantity, entry.modifiers ?? []);
            return items.create(priced);
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

        const order = orders.create({
          regionSlug,
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
          idempotencyKey,
          requestFingerprint,
          subtotal,
          total: subtotal,
          status: OrderStatus.NEW,
          items: lines,
        });
        return orders.save(order);
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const racedOrder = await this.findByIdempotencyKey(idempotencyKey);
      if (!racedOrder) throw error;
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
