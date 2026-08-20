import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Category } from "../catalog/category.entity";
import { Product } from "../catalog/product.entity";
import { regionContentSourceSlug } from "../catalog/region-content-source";
import { Region } from "../catalog/region.entity";
import { OrderItem } from "../orders/order-item.entity";
import { Order } from "../orders/order.entity";
import { OrderStatus } from "../orders/order.enums";
import { EduPosApiError, EduPosClient } from "./edu-pos.client";
import { createOrRecoverEduPosOrder } from "./edu-pos-order-submit";
import { buildEduPosMenuExportPayload } from "./edu-pos-menu-export";
import { backfillOrderItemMappings } from "./edu-pos-order-mapping";
import {
  canSyncOrderWithEduPos,
  EDU_POS_SUBMITTABLE_ORDER_STATUSES,
  eduPosRetryDelayMs,
  orderStatusAfterPosUpdate,
  posOrderStatusWithProgress,
} from "./edu-pos.policy";
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
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Region) private readonly regions: Repository<Region>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItems: Repository<OrderItem>,
  ) {}

  onModuleInit() {
    if (!this.client.isConfigured()) {
      this.logger.warn("EDU POS integration is disabled: EDU_POS_URL or EDU_POS_API_KEY is missing");
      return;
    }
    this.schedule(() => this.runBackground(() => this.syncMenu()), 1_000);
    this.schedule(() => this.runBackground(() => this.syncStopList()), 2_000);
    this.every(() => this.runBackground(() => this.syncMenu()), 5 * 60_000);
    this.every(() => this.runBackground(() => this.syncStopList()), 45_000);
    this.every(
      () => this.runBackground(() => this.syncActiveOrders(), "order sync"),
      7_500,
    );
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

  async exportMenu(regionSlug: string) {
    if (!this.client.isConfigured()) {
      throw new ServiceUnavailableException("EDU POS не настроен на сервере");
    }
    const region = await this.regions.findOne({ where: { slug: regionSlug, enabled: true } });
    if (!region) throw new BadRequestException("Город не найден или отключен");

    const menuSourceRegionSlug = regionContentSourceSlug(region, "menuSourceRegionSlug");
    const categories = await this.categories.find({
      where: { region: { slug: menuSourceRegionSlug } },
      relations: { region: true, products: true },
      order: { sortOrder: "ASC", id: "ASC", products: { sortOrder: "ASC", id: "ASC" } },
    });
    if (!categories.length) throw new BadRequestException("Для выбранного города меню пустое");

    const payload = buildEduPosMenuExportPayload(region.slug, menuSourceRegionSlug, categories);
    let result: unknown;
    try {
      result = await this.client.exportMenu(payload);
    } catch (error) {
      this.rememberError("menu export", error);
      const status = error instanceof EduPosApiError && error.status
        ? ` (HTTP ${error.status})`
        : "";
      const message = error instanceof Error ? error.message : "неизвестная ошибка";
      throw new BadGatewayException(`EDU POS не принял меню${status}: ${message}`);
    }
    return {
      configured: true,
      regionSlug: region.slug,
      menuSourceRegionSlug,
      categories: payload.categories.length,
      products: payload.categories.reduce((total, category) => total + category.products.length, 0),
      exportedAt: payload.exportedAt,
      result,
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
    if (!canSyncOrderWithEduPos(order.status, order.adminConfirmedAt)) return order;
    await this.refreshOrderItemMappings(order);
    const unmapped = order.items.filter((item) => !item.posDishId);
    if (unmapped.length) {
      const error = new BadRequestException(
        `Не сопоставлены с EDU POS: ${unmapped.map((item) => item.productName).join(", ")}`,
      );
      await this.markFailed(order, error, false);
      if (throwOnFailure) throw error;
      return order;
    }
    if (order.posSyncStatus === "synced" && order.posOrderId) return order;
    try {
      const result = await this.createOrRecoverOrder(order);
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

  async confirmOrder(order: Order) {
    if (order.status !== OrderStatus.NEW) {
      throw new BadRequestException(`Order cannot transition from ${order.status} to confirmed`);
    }
    if (!this.client.isConfigured()) {
      throw new ServiceUnavailableException("EDU POS не настроен: заказ оставлен новым");
    }
    await this.refreshOrderItemMappings(order);
    const unmapped = order.items.filter((item) => !item.posDishId);
    if (unmapped.length) {
      throw new BadRequestException(
        `Нельзя подтвердить заказ. Не сопоставлены с EDU POS: ${unmapped.map((item) => item.productName).join(", ")}`,
      );
    }

    const now = new Date();
    const staleAt = new Date(now.getTime() - 60_000);
    const claim = await this.orders.createQueryBuilder()
      .update(Order)
      .set({
        posSyncStatus: "submitting",
        posLastError: "",
        posLastSyncAt: now,
        posNextRetryAt: null,
      })
      .where("id = :id", { id: order.id })
      .andWhere("status = :status", { status: OrderStatus.NEW })
      .andWhere(`(
        "posSyncStatus" IN (:...claimable)
        OR ("posSyncStatus" = :submitting AND ("posLastSyncAt" IS NULL OR "posLastSyncAt" < :staleAt))
      )`, {
        claimable: ["pending", "pos_sync_failed"],
        submitting: "submitting",
        staleAt,
      })
      .execute();

    if (!claim.affected) {
      const current = await this.orders.findOne({ where: { id: order.id }, relations: { items: true } });
      if (!current) throw new BadRequestException("Заказ не найден");
      if (current.status !== OrderStatus.NEW) return current;
      if (current.posSyncStatus === "synced" && current.posOrderId) {
        current.status = OrderStatus.CONFIRMED;
        current.adminConfirmedAt = new Date();
        return this.orders.save(current);
      }
      throw new ConflictException("Заказ уже отправляется на кухню. Подождите несколько секунд");
    }

    order.posSyncStatus = "submitting";
    order.posLastError = "";
    order.posLastSyncAt = now;
    order.posNextRetryAt = null;
    try {
      const result = await this.createOrRecoverOrder(order);
      await this.applyPosOrder(order, result, true);
      return order;
    } catch (error) {
      await this.markFailed(order, error, false);
      if (error instanceof BadRequestException) throw error;
      throw new ServiceUnavailableException(
        "Кухня не приняла заказ. Он оставлен новым — повторите подтверждение",
      );
    }
  }

  async syncActiveOrders() {
    if (!this.client.isConfigured() || this.syncingOrders) return;
    this.syncingOrders = true;
    try {
      const dueSubmissions = await this.orders.createQueryBuilder("order")
        .leftJoinAndSelect("order.items", "item")
        .where("order.status IN (:...submittableStatuses)", {
          submittableStatuses: [...EDU_POS_SUBMITTABLE_ORDER_STATUSES],
        })
        .andWhere("order.adminConfirmedAt IS NOT NULL")
        .andWhere(`(
          order.posSyncStatus = :pending
          OR (
            order.posSyncStatus = :failed
            AND order.posRetryCount < :maxRetries
            AND order.posNextRetryAt IS NOT NULL
            AND order.posNextRetryAt <= :now
          )
        )`, {
          pending: "pending",
          failed: "pos_sync_failed",
          maxRetries: MAX_RETRIES,
          now: new Date(),
        })
        .take(20)
        .getMany();
      for (const order of dueSubmissions) await this.submitOrder(order, false);

      const active = await this.orders.createQueryBuilder("order")
        .leftJoinAndSelect("order.items", "item")
        .where("order.posSyncStatus = :synced", { synced: "synced" })
        .andWhere("order.status <> :newStatus", { newStatus: OrderStatus.NEW })
        .andWhere("order.adminConfirmedAt IS NOT NULL")
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

  async checkConnection() {
    if (!this.client.isConfigured()) {
      throw new ServiceUnavailableException("EDU POS не настроен на сервере");
    }
    try {
      const dishes = this.parseMenu(await this.client.menu());
      this.lastError = "";
      return {
        configured: true,
        connected: true,
        dishes: dishes.length,
        checkedAt: new Date(),
      };
    } catch (error) {
      this.rememberError("connection check", error);
      const message = error instanceof Error ? error.message : "неизвестная ошибка";
      throw new BadGatewayException(`Не удалось подключиться к EDU POS: ${message}`);
    }
  }

  private async refreshOrderItemMappings(order: Order) {
    const productIds = [...new Set(order.items
      .filter((item) => !item.posDishId)
      .map((item) => item.productId))];
    if (!productIds.length) return;

    const products = await this.products.findBy({ id: In(productIds) });
    const updatedItems = backfillOrderItemMappings(order.items, products);
    if (updatedItems.length) await this.orderItems.save(updatedItems);
  }

  private orderPayload(order: Order): EduPosCreateOrderPayload {
    if (!order.externalOrderId) throw new Error("Order has no externalOrderId");
    const kit = [
      order.noUtensils ? "без палочек" : `палочки ×${order.utensilsCount}`,
      ...(order.kitItems ?? [])
        .filter((item) => item.quantity > 0)
        .map((item) => `${item.name} ×${item.quantity}`),
    ].join(", ");
    return {
      externalOrderId: order.externalOrderId,
      customerName: order.customerName,
      customerPhone: order.phone,
      deliveryAddress: order.address,
      comment: [order.comment, `Комплектация: ${kit}`].filter(Boolean).join("\n"),
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

  private async createOrRecoverOrder(order: Order) {
    if (!order.externalOrderId) throw new Error("Order has no externalOrderId");
    return createOrRecoverEduPosOrder({
      externalOrderId: order.externalOrderId,
      isRetry: order.posSyncStatus === "pos_sync_failed" || order.posRetryCount > 0,
      create: () => this.client.createOrder(this.orderPayload(order)),
      lookup: () => this.client.order(order.externalOrderId!),
    });
  }

  private async applyPosOrder(order: Order, pos: EduPosOrder, confirmAccepted = false) {
    if (pos.externalOrderId !== order.externalOrderId) {
      throw new EduPosApiError(409, "EDU POS вернул другой заказ");
    }
    const linkedOrder = await this.orders.findOne({ where: { posOrderId: pos.id } });
    if (linkedOrder && linkedOrder.id !== order.id) {
      throw new EduPosApiError(409, "Ответ EDU POS уже связан с другим заказом");
    }
    const effectivePosStatus = posOrderStatusWithProgress(
      pos.status,
      pos.progress.itemsTotal,
      pos.progress.itemsReady,
      pos.progress.itemsRejected,
    );
    order.posOrderId = pos.id;
    order.posOrderNumber = pos.orderNumber || null;
    order.posStatus = effectivePosStatus;
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
    order.status = orderStatusAfterPosUpdate(order.status, effectivePosStatus, confirmAccepted);
    if (confirmAccepted && order.status !== OrderStatus.NEW) {
      order.adminConfirmedAt = order.adminConfirmedAt ?? new Date();
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

  private async markFailed(order: Order, error: unknown, scheduleRetry = true) {
    const persisted = await this.orders.findOne({ where: { id: order.id }, relations: { items: true } });
    const failed = persisted ?? order;
    failed.posSyncStatus = "pos_sync_failed";
    failed.posRetryCount += 1;
    const retryDelay = eduPosRetryDelayMs(failed.posRetryCount);
    failed.posNextRetryAt = scheduleRetry && failed.posRetryCount < MAX_RETRIES
      ? new Date(Date.now() + retryDelay)
      : null;
    failed.posLastSyncAt = new Date();
    failed.posLastError = error instanceof Error ? error.message.slice(0, 1_000) : "Unknown EDU POS error";
    await this.orders.save(failed);
    Object.assign(order, failed);
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

  private runBackground(task: () => Promise<unknown>, fallbackOperation?: string) {
    void task().catch((error: unknown) => {
      // Menu and stop-list jobs record their own detailed error before rejecting.
      // The scheduled runner must absorb that rejection so an external POS outage
      // cannot terminate the API process. Other jobs use the fallback label here.
      if (fallbackOperation) this.rememberError(fallbackOperation, error);
    });
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
