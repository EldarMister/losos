const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

type DeliveryHours = {
  deliveryOpenTime?: string;
  deliveryCloseTime?: string;
  deliveryIs24Hours?: boolean;
  deliveryWorkingDays?: number[];
};

const everyDay = [0, 1, 2, 3, 4, 5, 6];

function workingDays(value: number[] | undefined) {
  if (!Array.isArray(value)) return new Set(everyDay);
  return new Set(value.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6));
}

function parseTime(value: string | undefined, fallback: string) {
  const source = value && TIME_PATTERN.test(value) ? value : fallback;
  const [hours, minutes] = source.split(":").map(Number);
  return hours * 60 + minutes;
}

export function bishkekClockMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bishkek",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hours = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minutes = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hours * 60 + minutes;
}

export function bishkekWeekday(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bishkek", weekday: "short" }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

export function isDeliveryOpenAt(hours: DeliveryHours, date = new Date()) {
  const days = workingDays(hours.deliveryWorkingDays);
  const today = bishkekWeekday(date);
  const yesterday = (today + 6) % 7;
  if (hours.deliveryIs24Hours) return days.has(today);

  const opensAt = parseTime(hours.deliveryOpenTime, "11:30");
  const closesAt = parseTime(hours.deliveryCloseTime, "22:30");
  if (opensAt === closesAt) return days.has(today);

  const now = bishkekClockMinutes(date);
  return opensAt < closesAt
    ? days.has(today) && now >= opensAt && now < closesAt
    : now >= opensAt ? days.has(today) : now < closesAt && days.has(yesterday);
}
