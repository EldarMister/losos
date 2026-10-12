export type AdminPeriodPreset = "today" | "week" | "month" | "all" | "custom";
export type AdminPeriod = { preset: AdminPeriodPreset; from: string; to: string };

export function businessToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bishkek" }).format(now);
}

// Calendar arithmetic on date-only values must not depend on the device's zone.
export function shiftDay(day: string, amount: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function presetPeriod(preset: Exclude<AdminPeriodPreset, "custom">, now = new Date()): AdminPeriod {
  if (preset === "all") return { preset, from: "", to: "" };
  const to = businessToday(now);
  return { preset, from: shiftDay(to, preset === "week" ? -6 : preset === "month" ? -29 : 0), to };
}

export function selectPeriodDate(period: AdminPeriod, field: "from" | "to", day: string, maxDays?: number): AdminPeriod {
  let from = field === "from" ? day : period.from;
  let to = field === "to" ? day : period.to;
  if (from > to) {
    if (field === "from") to = from;
    else from = to;
  }
  if (maxDays && to > shiftDay(from, maxDays - 1)) {
    if (field === "from") to = shiftDay(from, maxDays - 1);
    else from = shiftDay(to, 1 - maxDays);
  }
  return { preset: "custom", from, to };
}
