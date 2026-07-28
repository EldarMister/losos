const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

type DeliveryHours = {
  deliveryOpenTime?: string;
  deliveryCloseTime?: string;
};

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

export function isDeliveryOpenAt(hours: DeliveryHours, date = new Date()) {
  const opensAt = parseTime(hours.deliveryOpenTime, "11:30");
  const closesAt = parseTime(hours.deliveryCloseTime, "22:30");
  if (opensAt === closesAt) return true;

  const now = bishkekClockMinutes(date);
  return opensAt < closesAt
    ? now >= opensAt && now < closesAt
    : now >= opensAt || now < closesAt;
}
