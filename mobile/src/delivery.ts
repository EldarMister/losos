import type { DeliveryType, Region } from "./types";

export const DEFAULT_DELIVERY_FEE = 99;
export const DEFAULT_DELIVERY_MINUTES = 50;
export const DEFAULT_MINIMUM_ORDER = 900;
export const DEFAULT_MAXIMUM_ORDER = 30_000;
export const DEFAULT_FREE_DELIVERY_THRESHOLD = 4_900;

export function estimatedDeliveryMinutes(region?: Region | null) {
  return region?.estimatedDeliveryMinutes ?? DEFAULT_DELIVERY_MINUTES;
}

export function deliveryEtaLabel(region?: Region | null) {
  return `~${estimatedDeliveryMinutes(region)} мин`;
}

export function freeDeliveryThreshold(region?: Region | null) {
  return region?.freeDeliveryThreshold ?? DEFAULT_FREE_DELIVERY_THRESHOLD;
}

export function deliveryFeeFor(
  region: Region | null | undefined,
  cartTotal: number,
  deliveryType: DeliveryType,
) {
  if (deliveryType === "pickup" || cartTotal >= freeDeliveryThreshold(region)) return 0;
  return region?.deliveryFee ?? DEFAULT_DELIVERY_FEE;
}

export function freeDeliveryRemaining(region: Region | null | undefined, cartTotal: number) {
  return Math.max(0, freeDeliveryThreshold(region) - cartTotal);
}

export function minimumOrderAmount(region?: Region | null) {
  return region?.minimumOrderAmount ?? DEFAULT_MINIMUM_ORDER;
}

export function maximumOrderAmount(region?: Region | null) {
  return region?.maximumOrderAmount ?? DEFAULT_MAXIMUM_ORDER;
}

export function kitchenSchedule(region?: Region | null) {
  if (region?.deliveryIs24Hours) return "Ежедневно, без выходных\nКруглосуточно";
  if (region?.deliveryOpenTime && region.deliveryCloseTime) {
    return `Ежедневно, без выходных\n${region.deliveryOpenTime} – ${region.deliveryCloseTime}`;
  }
  return "График работы уточняется";
}
