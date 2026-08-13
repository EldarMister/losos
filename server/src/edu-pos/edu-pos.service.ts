import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "../catalog/product.entity";
import { OrderItem } from "../orders/order-item.entity";
import { Order } from "../orders/order.entity";
import { OrderStatus } from "../orders/order.enums";
import { EduPosApiError, EduPosClient } from "./edu-pos.client";
import { eduPosRetryDelayMs, internalOrderStatusForPos } from "./edu-pos.policy";
import type {
  EduPosCreateOrderPayload,
  EduPosMenuDish,
  EduPosMenuVariant,
  EduPosOrder,
} from "./edu-pos.types";

type JsonRecord = Record<string, unknown>;
const TERMINAL_POS_STATUSES = new Set(["ready", "rejected", "cancelled"]);
const MAX_RETRIES = 8;

const record = (value: unknown): JsonRecord => (
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {}
);
const array = (value: unknown) => Array.isArray(value) ? value : [];
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const numberOrNull = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};
const boolean = (value: unknown, fallback = true) => typeof value === "boolean" ? value : fallback;
const normalizeName = (value: string) => value.toLocaleLowerCase("ru").replace(/[^a-zа-яё0-9]+/gi, " ").trim();
const safeDate = (value: string | null) => value && !Number.isNaN(Date.parse(value)) ? new Date(value) : null;

@Injectable()
export class EduPosService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EduPosService.name);
  private readonly timers: NodeJS.Timeout[] = [];
  private syncingMenu = false;
  private syncingStopList = false;
  private syncingOrders = false;
  private lastMenuSyncAt: Date | null = null;
  private lastStopListSyncAt: Date | null = null;
  private lastError = "";

  constructor(
    private readonly client: EduPosClient,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItems: Repository<OrderItem>,
  ) {}

  onModuleInit() {
    if (!this.client.isConfigured()) {
      this.logger.warn("EDU POS integration is disabled: EDU_POS_URL or EDU_POS_API_KEY is missing");
      return;
    }
    this.schedule(() => void this.syncMenu(), 1_000);
    this.schedule(() => void this.syncStopList(), 2_000);
    this.every(() => void this.syncMenu(), 5 * 60_000);
    this.every(() => void this.syncStopList(), 45_000);
    this.every(() => void this.syncActiveOrders(), 7_500);
  }

  onModuleDestroy() {
    for (const timer of this.timers) clearTimeout(timer);
  }

  isConfigured() {
    return this.client.isConfigured();
  }

  status() {
    return {
      configured: this.client.isConfigured(),
      lastMenuSyncAt: this.lastMenuSyncAt,
      lastStopListSyncAt: this.lastStopListSyncAt,
      lastError: this.lastError || null,
      intervals: { menuSeconds: 300, stopListSeconds: 45, ordersSeconds: 7.5 },
    };
  }

  async syncMenu() {
    if (!this.client.isConfigured()) return { configured: false, matched: 0, received: 0 };
    if (this.syncingMenu) return { configured: true, skipped: true };
    this.syncingMenu = true;
    try {
      const dishes = this.parseMenu(await this.client.menu());
      const products = await this.products.find();
      const byId = new Map(dishes.map((dish) => [dish.id, dish]));
      const byName = new Map<string, EduPosMenuDish[]>();
      for (const dish of dishes) {
        const key = normalizeName(dish.name);
        byName.set(key, [...(byName.get(key) ?? []), dish]);
      }

      let matched = 0;
      const syncedAt = new Date();
      for (const product of products) {
        const named = byName.get(normalizeName(product.name)) ?? [];
        const dish = (product.posDishId ? byId.get(product.posDishId) : null)
          ?? (named.length === 1 ? named[0] : null);
        if (!dish) continue;
        const variant = this.chooseVariant(dish, product.posVariantId);
        product.posDishId = dish.id;
        product.posVariantId = variant?.id ?? product.posVariantId ?? null;
        product.posAvailable = dish.isAvailable && (variant?.isAvailable ?? true);
        product.posSoldByWeight = dish.soldByWeight;
        product.posLastSyncedAt = syncedAt;
        const price = variant?.price ?? dish.price;
        const originalPrice = variant?.originalPrice ?? dish.originalPrice;
        if (price !== null && Number.isSafeInteger(Math.round(price))) {
          product.price = Math.round(price);
          product.oldPrice = originalPrice !== null && originalPrice > price ? Math.round(originalPrice) : null;
        }
        matched += 1;
      }
      if (matched) await this.products.save(products.filter((product) => product.posLastSyncedAt === syncedAt));
      this.lastMenuSyncAt = syncedAt;
      this.lastError = "";
      return { configured: true, matched, received: dishes.length, syncedAt };
    } catch (error) {
      this.rememberError("menu", error);
      throw error;
    } finally {
      this.syncingMenu = false;
    }
  }

  async syncStopList() {
    if (!this.client.isConfigured()) return { configured: false, unavailable: 0 };
    if (this.syncingStopList) return { configured: true, skipped: true };
    this.syncingStopList = true;
    try {
      const entries = this.parseStopList(await this.client.stopList());
      const products = await this.products.find();
      const now = new Date();
      let unavailable = 0;
      const changed: Product[] = [];
      for (const product of products) {
        if (!product.posDishId) continue;
        const blocked = entries.some((entry) => entry.dishId === product.posDishId
          && (!entry.variantId || !product.posVariantId || entry.variantId === product.posVariantId));
        if (product.posAvailable !== !blocked || product.posLastSyncedAt === null) {
          product.posAvailable = !blocked;
          product.posLastSyncedAt = now;
          changed.push(product);
        }
        if (blocked) unavailable += 1;
      }
      if (changed.length) await this.products.save(changed);
      this.lastStopListSyncAt = now;
      this.lastError = "";
      return { configured: true, unavailable, received: entries.length, syncedAt: now };
    } catch (error) {
      this.rememberError("stop-list", error);
      throw error;
    } finally {
      this.syncingStopList = false;
    }
  }

  async submitOrder(order: Order, throwOnFailure = true) {
    if (!this.client.isConfigured()) return order;
    // Keep the existing local order flow available while the POS catalogue is
    // still being populated. A partially mapped order cannot be sent to EDU
    // POS safely because its API accepts IDs only.
    if (order.items.some((item) => !item.posDishId)) return order;
    if (order.posSyncStatus === "synced" && order.posOrderId) return order;
    try {
      const result = await this.client.createOrder(this.orderPayload(order));
      await this.applyPosOrder(order, result);
      return order;
    } catch (error) {
      await this.markFailed(order, error);
      if (!throwOnFailure) return order;
      if (error instanceof EduPosApiError && error.status === 400) {
        void this.refreshCatalogAfterRejectedOrder();
        throw new BadRequestException("Некоторые блюда больше недоступны. Обновите корзину и попробуйте снова");
      }
      throw new ServiceUnavailableException("Кухня временно не подтвердила заказ. Повторите отправку — дубль не создастся");
    }
  }

  async syncActiveOrders() {
    if (!this.client.isConfigured() || this.syncingOrders) return;
    this.syncingOrders = true;
    try {
      const dueFailed = await this.orders.createQueryBuilder("order")
        .leftJoinAndSelect("order.items", "item")
        .where("order.posSyncStatus = :failed", { failed: "pos_sync_failed" })
        .andWhere("order.posRetryCount < :maxRetries", { maxRetries: MAX_RETRIES })
        .andWhere("(order.posNextRetryAt IS NULL OR order.posNextRetryAt <= :now)", { now: new Date() })
        .take(20)
        .getMany();
      for (const order of dueFailed) await this.submitOrder(order, false);

      const active = await this.orders.createQueryBuilder("order")
        .leftJoinAndSelect("order.items", "item")
        .where("order.posSyncStatus = :synced", { synced: "synced" })
        .andWhere("order.posStatus NOT IN (:...terminal)", { terminal: [...TERMINAL_POS_STATUSES] })
        .take(50)
        .getMany();
      for (const order of active) {
        if (!order.externalOrderId) continue;
        try {
          await this.applyPosOrder(order, await this.client.order(order.externalOrderId));
        } catch (error) {
          this.rememberError(`order ${order.id}`, error);
        }
      }
    } finally {
      this.syncingOrders = false;
    }
  }

  assertProductsOrderable(products: Product[]) {
    if (!this.client.isConfigured()) return;
    const unavailable = products.filter((product) => product.posDishId && !product.posAvailable);
    if (unavailable.length) {
      throw new BadRequestException(`Сейчас недоступно: ${unavailable.map((product) => product.name).join(", ")}`);
    }
  }

  private orderPayload(order: Order): EduPosCreateOrderPayload {
    if (!order.externalOrderId) throw new Error("Order has no externalOrderId");
    return {
      externalOrderId: order.externalOrderId,
      customerName: order.customerName,
      customerPhone: order.phone,
      deliveryAddress: order.address,
      comment: order.comment || undefined,
      items: order.items.map((item) => {
        if (!item.posDishId) throw new Error(`Order item ${item.id} has no EDU POS dish mapping`);
        const modifiers = item.modifierSnapshots
          .filter((modifier) => modifier.quantity > 0)
          .map((modifier) => `${modifier.itemName} ×${modifier.quantity}`)
          .join(", ");
        return {
          dishId: item.posDishId,
          ...(item.posVariantId ? { variantId: item.posVariantId } : {}),
          quantity: item.quantity,
          ...(item.posWeightGrams ? { weightGrams: item.posWeightGrams } : {}),
          ...(modifiers ? { comment: modifiers } : {}),
        };
      }),
    };
  }

  private async applyPosOrder(order: Order, pos: EduPosOrder) {
    order.posOrderId = pos.id;
    order.posOrderNumber = pos.orderNumber || null;
    order.posStatus = pos.status;
    order.posSyncStatus = "synced";
    order.posItemsTotal = pos.progress.itemsTotal;
    order.posItemsReady = pos.progress.itemsReady;
    order.posItemsRejected = pos.progress.itemsRejected;
    order.posCreatedAt = safeDate(pos.createdAt) ?? order.posCreatedAt;
    order.posUpdatedAt = safeDate(pos.updatedAt) ?? new Date();
    order.posLastSyncAt = new Date();
    order.posRetryCount = 0;
    order.posNextRetryAt = null;
    order.posLastError = "";
    const mappedStatus = internalOrderStatusForPos(pos.status);
    if (mappedStatus && ![OrderStatus.DELIVERING, OrderStatus.COMPLETED].includes(order.status)) {
      order.status = mappedStatus;
    }
    await this.orders.save(order);

    for (const item of order.items) {
      const posItem = pos.items.find((candidate) => candidate.dishId === item.posDishId
        && (!candidate.variantId || !item.posVariantId || candidate.variantId === item.posVariantId));
      if (!posItem) continue;
      item.posStatus = posItem.status;
      item.posReadyQuantity = posItem.readyQuantity;
      item.posRejectReason = posItem.rejectReason;
    }
    if (order.items.length) await this.orderItems.save(order.items);
  }

  private async markFailed(order: Order, error: unknown) {
    order.posSyncStatus = "pos_sync_failed";
    order.posRetryCount += 1;
    const retryDelay = eduPosRetryDelayMs(order.posRetryCount);
    order.posNextRetryAt = order.posRetryCount < MAX_RETRIES ? new Date(Date.now() + retryDelay) : null;
    order.posLastSyncAt = new Date();
    order.posLastError = error instanceof Error ? error.message.slice(0, 1_000) : "Unknown EDU POS error";
    await this.orders.save(order);
    this.rememberError(`submit order ${order.id}`, error);
  }

  private chooseVariant(dish: EduPosMenuDish, id: string | null) {
    return (id ? dish.variants.find((variant) => variant.id === id) : null)
      ?? (dish.variants.length === 1 ? dish.variants[0] : null);
  }

  private parseMenu(value: unknown): EduPosMenuDish[] {
    const root = record(value);
    const data = record(root.data);
    const categories = [...array(root.categories), ...array(data.categories)];
    const rawDishes = [
      ...array(value),
      ...array(root.dishes), ...array(root.items), ...array(root.products),
      ...array(data.dishes), ...array(data.items), ...array(data.products),
      ...categories.flatMap((category) => {
        const entry = record(category);
        return [...array(entry.dishes), ...array(entry.items), ...array(entry.products)];
      }),
    ];
    const seen = new Set<string>();
    return rawDishes.flatMap((entry): EduPosMenuDish[] => {
      const dish = record(entry);
      const id = text(dish.id) || text(dish.dishId);
      const name = text(dish.name) || text(dish.title);
      if (!id || !name || seen.has(id)) return [];
      seen.add(id);
      const variants = array(dish.variants).flatMap((variantEntry): EduPosMenuVariant[] => {
        const variant = record(variantEntry);
        const variantId = text(variant.id) || text(variant.variantId);
        if (!variantId) return [];
        const price = numberOrNull(variant.discountPrice ?? variant.salePrice ?? variant.price);
        return [{
          id: variantId,
          price,
          originalPrice: numberOrNull(variant.originalPrice ?? variant.oldPrice),
          isAvailable: boolean(variant.isAvailable, boolean(variant.available)),
        }];
      });
      return [{
        id,
        name,
        price: numberOrNull(dish.discountPrice ?? dish.salePrice ?? dish.price),
        originalPrice: numberOrNull(dish.originalPrice ?? dish.oldPrice),
        isAvailable: boolean(dish.isAvailable, boolean(dish.available)),
        soldByWeight: boolean(dish.soldByWeight, boolean(dish.isWeighted, false)),
        variants,
      }];
    });
  }

  private parseStopList(value: unknown) {
    const root = record(value);
    const data = record(root.data);
    const entries = [...array(value), ...array(root.items), ...array(root.dishes), ...array(root.stopList), ...array(data.items), ...array(data.dishes)];
    return entries.flatMap((entry) => {
      const item = record(entry);
      const dishId = text(item.dishId) || text(item.id);
      if (!dishId) return [];
      return [{ dishId, variantId: text(item.variantId) || null }];
    });
  }

  private async refreshCatalogAfterRejectedOrder() {
    await Promise.allSettled([this.syncMenu(), this.syncStopList()]);
  }

  private rememberError(operation: string, error: unknown) {
    const status = error instanceof EduPosApiError && error.status ? ` (${error.status})` : "";
    const message = error instanceof Error ? error.message : "Unknown error";
    this.lastError = `${operation}: ${message}`.slice(0, 1_000);
    this.logger.error(`EDU POS ${operation} failed${status}: ${message}`);
  }

  private schedule(callback: () => void, delay: number) {
    const timer = setTimeout(callback, delay);
    timer.unref?.();
    this.timers.push(timer);
  }

  private every(callback: () => void, delay: number) {
    const timer = setInterval(callback, delay);
    timer.unref?.();
    this.timers.push(timer);
  }
}
