export enum DeliveryType {
  DELIVERY = "delivery",
  PICKUP = "pickup",
}

export enum PaymentMethod {
  CASH = "cash",
  CARD = "card",
  ONLINE = "online",
}

export enum OrderStatus {
  NEW = "new",
  CONFIRMED = "confirmed",
  PREPARING = "preparing",
  READY = "ready",
  DELIVERING = "delivering",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

const allowedStatusTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.NEW]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.DELIVERING, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function canTransitionOrderStatus(current: OrderStatus, next: OrderStatus) {
  return current === next || allowedStatusTransitions[current].includes(next);
}
