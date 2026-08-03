import type { DeliveryType, Region } from "./types";

export const DEFAULT_DELIVERY_FEE = 99;
export const DEFAULT_DELIVERY_MINUTES = 50;
export const DEFAULT_MINIMUM_ORDER = 900;
export const DEFAULT_MAXIMUM_ORDER = 30_000;
export const DEFAULT_FREE_DELIVERY_THRESHOLD = 4_900;
export const DEFAULT_OPEN_TIME = "11:30";
export const DEFAULT_CLOSE_TIME = "22:30";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAY_LABELS = [
  "в воскресенье",
  "в понедельник",
  "во вторник",
  "в среду",
  "в четверг",
  "в пятницу",
  "в субботу",
];

function timeMinutes(value: string | undefined, fallback: string) {
  const source = value && TIME_PATTERN.test(value) ? value : fallback;
  const [hours, minutes] = source.split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizedWorkingDays(value: number[] | undefined) {
  if (!Array.isArray(value)) return ALL_WEEKDAYS;
  return [...new Set(value.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))];
}

function bishkekClock(date: Date) {
  // Hermes on some Android builds accepts `timeZone` but still formats in UTC.
  // Bishkek is UTC+06 year-round, so calculate it explicitly and consistently.
  const bishkekDate = new Date(date.getTime() + 6 * 60 * 60 * 1_000);
  return {
    day: bishkekDate.getUTCDay(),
    minutes: bishkekDate.getUTCHours() * 60 + bishkekDate.getUTCMinutes(),
  };
}

export type OrderingAvailability = {
  isOpen: boolean;
  nextOpenLabel: string;
  nextOpenTime: string;
};

/** Global kitchen schedule shared by delivery and pickup. */
export function orderingAvailability(region?: Region | null, date = new Date()): OrderingAvailability {
  const days = normalizedWorkingDays(region?.deliveryWorkingDays);
  const workingDays = new Set(days);
  const { day: today, minutes: now } = bishkekClock(date);
  const yesterday = (today + 6) % 7;
  const is24Hours = region?.deliveryIs24Hours === true;
  const openTime = region?.deliveryOpenTime && TIME_PATTERN.test(region.deliveryOpenTime)
    ? region.deliveryOpenTime
    : DEFAULT_OPEN_TIME;
  const closeTime = region?.deliveryCloseTime && TIME_PATTERN.test(region.deliveryCloseTime)
    ? region.deliveryCloseTime
    : DEFAULT_CLOSE_TIME;
  const opensAt = timeMinutes(openTime, DEFAULT_OPEN_TIME);
  const closesAt = timeMinutes(closeTime, DEFAULT_CLOSE_TIME);

  const isOpen = is24Hours
    ? workingDays.has(today)
    : opensAt === closesAt
      ? workingDays.has(today)
      : opensAt < closesAt
        ? workingDays.has(today) && now >= opensAt && now < closesAt
        : now >= opensAt ? workingDays.has(today) : now < closesAt && workingDays.has(yesterday);

  const nextOpenTime = is24Hours ? "00:00" : openTime;
  if (isOpen) return { isOpen: true, nextOpenLabel: "Кухня открыта", nextOpenTime };

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidateDay = (today + offset) % 7;
    if (!workingDays.has(candidateDay)) continue;
    if (offset === 0 && !is24Hours && now >= opensAt) continue;
    const dayLabel = offset === 0
      ? "сегодня"
      : offset === 1 ? "завтра" : WEEKDAY_LABELS[candidateDay];
    return {
      isOpen: false,
      nextOpenTime,
      nextOpenLabel: `Откроемся ${dayLabel} в ${nextOpenTime}`,
    };
  }

  return { isOpen: false, nextOpenTime, nextOpenLabel: "Кухня временно закрыта" };
}

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
  const days = normalizedWorkingDays(region?.deliveryWorkingDays);
  const dayLabel = days.length === 7
    ? "Ежедневно, без выходных"
    : days.length > 0
      ? days.map((day) => ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][day]).join(", ")
      : "Нет рабочих дней";
  if (region?.deliveryIs24Hours) return `${dayLabel}\nКруглосуточно`;
  const openTime = region?.deliveryOpenTime || DEFAULT_OPEN_TIME;
  const closeTime = region?.deliveryCloseTime || DEFAULT_CLOSE_TIME;
  return `${dayLabel}\n${openTime} – ${closeTime}`;
}
