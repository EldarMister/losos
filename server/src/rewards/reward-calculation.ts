import { BadRequestException } from "@nestjs/common";
import type { OrderItem } from "../orders/order-item.entity";
import { POSTGRES_INTEGER_MAX } from "../common/numeric-limits";

export function calculateOrderRewards(
  items: Array<Pick<OrderItem, "quantity" | "naktaCoinsReward">>,
) {
  const naktaCoins = items.reduce(
    (total, item) => total + Math.max(0, item.naktaCoinsReward || 0) * item.quantity,
    0,
  );
  if (!Number.isSafeInteger(naktaCoins) || naktaCoins > POSTGRES_INTEGER_MAX) {
    throw new BadRequestException("Сумма награды NAKTA Coin слишком велика");
  }
  return { naktaCoins };
}

export function isNftMilestone(completedOrders: number, everyOrders: number) {
  return Number.isInteger(completedOrders)
    && completedOrders > 0
    && Number.isInteger(everyOrders)
    && everyOrders > 0
    && completedOrders % everyOrders === 0;
}
