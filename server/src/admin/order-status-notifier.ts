import type { OrderStatus } from "../orders/order.enums";
import type { PushNotificationsService } from "../notifications/push-notifications.service";

type PushRecipientOrder = {
  id: string;
  phone: string;
  status: OrderStatus;
};

export function dispatchOrderStatusPush(
  pushNotifications: Pick<PushNotificationsService, "sendOrderStatus">,
  order: PushRecipientOrder,
) {
  void pushNotifications.sendOrderStatus(
    order.phone,
    order.id,
    order.status,
  ).catch((error) => {
    console.error("Order status changed, but push dispatch failed", error);
  });
}
