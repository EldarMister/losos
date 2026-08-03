import {
  deliveryEtaLabel,
  deliveryFeeFor,
  freeDeliveryRemaining,
  orderingAvailability,
} from "../delivery";
import type { Region } from "../types";

const region: Region = {
  id: 1,
  slug: "bishkek",
  name: "Бишкек",
  deliveryFee: 150,
  estimatedDeliveryMinutes: 45,
  freeDeliveryThreshold: 4_900,
};

describe("delivery presentation", () => {
  test("shows the configured ETA and fee until the free-delivery threshold", () => {
    expect(deliveryEtaLabel(region)).toBe("~45 мин");
    expect(deliveryFeeFor(region, 4_000, "delivery")).toBe(150);
    expect(freeDeliveryRemaining(region, 4_000)).toBe(900);
  });

  test("makes delivery free at the threshold and always keeps pickup free", () => {
    expect(deliveryFeeFor(region, 4_900, "delivery")).toBe(0);
    expect(deliveryFeeFor(region, 500, "pickup")).toBe(0);
  });

  test("uses the global schedule for accepting orders", () => {
    const scheduledRegion: Region = {
      ...region,
      deliveryOpenTime: "11:30",
      deliveryCloseTime: "22:30",
      deliveryWorkingDays: [1, 2, 3, 4, 5],
    };

    expect(orderingAvailability(scheduledRegion, new Date("2026-08-03T04:00:00.000Z"))).toEqual({
      isOpen: false,
      nextOpenLabel: "Откроемся сегодня в 11:30",
      nextOpenTime: "11:30",
    });
    expect(orderingAvailability(scheduledRegion, new Date("2026-08-03T06:00:00.000Z")).isOpen).toBe(true);
    expect(orderingAvailability(scheduledRegion, new Date("2026-08-07T18:00:00.000Z")).nextOpenLabel)
      .toBe("Откроемся в понедельник в 11:30");
  });
});
