import { OrderStatus } from "../orders/order.enums";

export const EDU_POS_SUBMITTABLE_ORDER_STATUSES = [
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERING,
] as const;

export function canSubmitOrderToEduPos(status: OrderStatus) {
  return (EDU_POS_SUBMITTABLE_ORDER_STATUSES as readonly OrderStatus[]).includes(status);
}

export function canSyncOrderWithEduPos(status: OrderStatus, adminConfirmedAt: Date | null) {
  return Boolean(adminConfirmedAt) && canSubmitOrderToEduPos(status);
}

export function shouldSubmitOrderToEduPosAfterAdminTransition(
  previousStatus: OrderStatus,
  nextStatus: OrderStatus,
) {
  return previousStatus === OrderStatus.NEW && nextStatus === OrderStatus.CONFIRMED;
}

const RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000] as const;

export function eduPosRetryDelayMs(attempt: number) {
  return RETRY_DELAYS_MS[Math.min(Math.max(0, attempt - 1), RETRY_DELAYS_MS.length - 1)];
}
export function internalOrderStatusForPos(status: string): OrderStatus | null {
  if (status === "sent_to_kitchen") return OrderStatus.CONFIRMED;
  if (status === "accepted_by_kitchen" || status === "cooking" || status === "partially_rejected") {
    return OrderStatus.PREPARING;
  }
  if (status === "ready") return OrderStatus.READY;
  if (status === "rejected" || status === "cancelled") return OrderStatus.CANCELLED;
  return null;
}

export function orderStatusAfterPosUpdate(
  currentStatus: OrderStatus,
  posStatus: string,
  confirmAccepted: boolean,
) {
  const mappedStatus = internalOrderStatusForPos(posStatus);
  if ([OrderStatus.DELIVERING, OrderStatus.COMPLETED].includes(currentStatus)) {
    return currentStatus;
  }
  if (currentStatus === OrderStatus.NEW && !confirmAccepted) {
    return currentStatus;
  }
  if (mappedStatus === OrderStatus.CANCELLED) return mappedStatus;
  if (mappedStatus) {
    const progressRank: Partial<Record<OrderStatus, number>> = {
      [OrderStatus.NEW]: 0,
      [OrderStatus.CONFIRMED]: 1,
      [OrderStatus.PREPARING]: 2,
      [OrderStatus.READY]: 3,
    };
    const currentRank = progressRank[currentStatus];
    const mappedRank = progressRank[mappedStatus];
    if (currentRank !== undefined && mappedRank !== undefined && mappedRank < currentRank) {
      return currentStatus;
    }
    return mappedStatus;
  }
  return confirmAccepted && currentStatus === OrderStatus.NEW
    ? OrderStatus.CONFIRMED
    : currentStatus;
}

export function posOrderStatusWithProgress(
  status: string,
  itemsTotal: number,
  itemsReady: number,
  itemsRejected: number,
) {
  return itemsTotal > 0 && itemsRejected === 0 && itemsReady >= itemsTotal
    ? "ready"
    : status;
}
