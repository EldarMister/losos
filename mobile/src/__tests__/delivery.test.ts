import {
  deliveryEtaLabel,
  deliveryFeeFor,
  freeDeliveryRemaining,
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
});
