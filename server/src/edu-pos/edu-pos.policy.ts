import { OrderStatus } from "../orders/order.enums";

const RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000] as const;

export function eduPosRetryDelayMs(attempt: number) {
  return RETRY_DELAYS_MS[Math.min(Math.max(0, attempt - 1), RETRY_DELAYS_MS.length - 1)];
}
export function internalOrderStatusForPos(status: string): OrderStatus | null {
  if (status === "sent_to_kitchen" || status === "accepted_by_kitchen") return OrderStatus.CONFIRMED;
  if (status === "cooking" || status === "partially_rejected") return OrderStatus.PREPARING;
  if (status === "ready") return OrderStatus.READY;
  if (status === "rejected" || status === "cancelled") return OrderStatus.CANCELLED;
  return null;
}
