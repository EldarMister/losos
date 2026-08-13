import type { CreatedOrder } from "./types";

const orderStatuses = new Set([
  "new", "confirmed", "preparing", "ready", "delivering", "completed", "cancelled",
]);

export function isPersistedOrderReceipt(value: unknown): value is CreatedOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<CreatedOrder>;
  return typeof order.id === "string"
    && order.id.length >= 8
    && typeof order.status === "string"
    && orderStatuses.has(order.status)
    && typeof order.total === "number"
    && Number.isFinite(order.total);
}
