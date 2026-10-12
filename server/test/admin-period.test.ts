import assert from "node:assert/strict";
import test from "node:test";
import { businessToday, presetPeriod, selectPeriodDate, shiftDay } from "../../app/admin/admin-period";

test("admin ranges follow Bishkek midnight, including UTC's previous day", () => {
  assert.equal(businessToday(new Date("2026-10-12T17:59:59Z")), "2026-10-12");
  const now = new Date("2026-10-12T18:00:00Z");
  assert.equal(businessToday(now), "2026-10-13");
  assert.deepEqual(presetPeriod("today", now), { preset: "today", from: "2026-10-13", to: "2026-10-13" });
  assert.deepEqual(presetPeriod("week", now), { preset: "week", from: "2026-10-07", to: "2026-10-13" });
  assert.deepEqual(presetPeriod("month", now), { preset: "month", from: "2026-09-14", to: "2026-10-13" });
  assert.deepEqual(presetPeriod("all", now), { preset: "all", from: "", to: "" });
});

test("date-only arithmetic crosses month, year and leap-day boundaries", () => {
  assert.equal(shiftDay("2026-01-02", -6), "2025-12-27");
  assert.equal(shiftDay("2024-03-01", -1), "2024-02-29");
  assert.equal(shiftDay("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftDay("2026-01-01", 365), "2027-01-01");
});

test("custom dates can jump into past years or cross the other boundary without an invalid API range", () => {
  const week = presetPeriod("week", new Date("2026-10-13T10:00:00Z"));
  const oldRange = selectPeriodDate(week, "from", "2024-01-01", 366);
  assert.deepEqual(oldRange, { preset: "custom", from: "2024-01-01", to: "2024-12-31" });
  assert.deepEqual(selectPeriodDate(oldRange, "to", "2024-01-07", 366), { preset: "custom", from: "2024-01-01", to: "2024-01-07" });
  assert.deepEqual(selectPeriodDate(week, "to", "2026-10-01"), { preset: "custom", from: "2026-10-01", to: "2026-10-01" });
  assert.deepEqual(selectPeriodDate(week, "from", "2026-10-20"), { preset: "custom", from: "2026-10-20", to: "2026-10-20" });
  assert.deepEqual(selectPeriodDate(week, "to", "2027-12-31", 366), { preset: "custom", from: "2026-12-31", to: "2027-12-31" });
});
