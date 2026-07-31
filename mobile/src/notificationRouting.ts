import type * as Notifications from "expo-notifications";

export function notificationOrderId(
  response: Notifications.NotificationResponse | null | undefined,
) {
  const data = response?.notification.request.content.data;
  const value = data?.orderId;
  if (typeof value === "string" && value) return value;

  const url = data?.url;
  if (typeof url !== "string") return null;
  const match = /^naktasushi:\/\/orders\/([^/?#]+)/i.exec(url);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
