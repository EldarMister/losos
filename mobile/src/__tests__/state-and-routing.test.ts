import {
  initialModifierSelections,
  isModifierSelectionValid,
} from "../components/ProductSheet";
import {
  canStartCheckout,
  createOrderIdempotencyKey,
} from "../navigationRules";
import { notificationOrderId } from "../notificationRouting";
import { isPersistedOrderReceipt } from "../orderReceipt";
import { groupSearchResults } from "../searchResults";
import { brandPromotion } from "../promotionBranding";
import {
  isSpecificDeliveryAddress,
  photonFeatureToSuggestion,
  suggestAddresses,
} from "../geocoding";
import {
  createYandexMapHtml,
  getDeliveryZone,
  isPointInRegionBounds,
  isPointInDeliveryZone,
  isUsableInitialMapPoint,
  parseMapMessage,
} from "../components/yandexMapShared";
import { lineTotal, restorePersistedState } from "../store";
import type {
  AuthSession,
  CartLine,
  Product,
} from "../types";

const product: Product = {
  id: 11,
  slug: "roll",
  name: "Ролл",
  price: 400,
  image: "/roll.png",
  modifierGroups: [{
    id: "sauce",
    title: "Соус",
    selectionType: "single",
    required: true,
    items: [{ id: "spicy", name: "Острый", price: 50, image: "" }],
  }],
};

describe("mobile state and routing", () => {
  test("restores a valid persisted cart and fills new defaults", () => {
    const restored = restorePersistedState(JSON.stringify({
      onboarded: true,
      cart: [],
      regionSlug: "osh",
      deliveryType: "pickup",
      location: { address: "Кухня Ош", pickupLocationId: 7 },
    }));

    expect(restored).toMatchObject({
      onboarded: true,
      regionSlug: "osh",
      deliveryType: "pickup",
      notificationsAsked: false,
      utensilsCount: 1,
    });
  });

  test("rejects damaged persisted state", () => {
    expect(restorePersistedState("{broken")).toBeNull();
    expect(restorePersistedState(JSON.stringify({ onboarded: "yes" }))).toBeNull();
  });

  test("calculates product and per-line modifiers correctly", () => {
    const line: CartLine = {
      key: "11",
      product,
      quantity: 2,
      modifiers: [
        {
          groupId: "sauce",
          groupTitle: "Соус",
          itemId: "spicy",
          itemName: "Острый",
          price: 50,
          quantity: 1,
          priceScope: "per-product",
        },
        {
          groupId: "pack",
          groupTitle: "Комплектация",
          itemId: "bag",
          itemName: "Пакет",
          price: 20,
          quantity: 1,
          priceScope: "per-line",
        },
      ],
    };
    expect(lineTotal(line)).toBe(920);
  });

  test("enforces required modifiers", () => {
    const empty = initialModifierSelections(product);
    expect(isModifierSelectionValid(product, empty)).toBe(false);
    expect(isModifierSelectionValid(product, { sauce: { spicy: 1 } })).toBe(true);
    expect(isModifierSelectionValid(product, { sauce: { spicy: 2 } })).toBe(false);
  });

  test("gates checkout on a live auth session and a non-empty cart", () => {
    const session: AuthSession = {
      phone: "+996555123456",
      verificationToken: "a".repeat(64),
      expiresAt: Date.now() + 60_000,
    };
    expect(canStartCheckout(session, 1)).toBe(true);
    expect(canStartCheckout(session, 0)).toBe(false);
    expect(canStartCheckout({ ...session, expiresAt: Date.now() - 1 }, 1)).toBe(false);
    expect(canStartCheckout(null, 1)).toBe(false);
  });

  test("keeps checkout retries on a valid idempotency-key format", () => {
    expect(createOrderIdempotencyKey(12345, 0.123456789)).toMatch(
      /^mobile-12345-[a-z0-9]{1,8}$/,
    );
  });

  test("extracts an order id from a notification deep link payload", () => {
    const response = {
      notification: {
        request: {
          content: { data: { orderId: "order-42" } },
        },
      },
    };
    expect(notificationOrderId(response as never)).toBe("order-42");
    expect(notificationOrderId({
      notification: {
        request: {
          content: {
            data: { url: "naktasushi://orders/order%2042" },
          },
        },
      },
    } as never)).toBe("order 42");
    expect(notificationOrderId(null)).toBeNull();
  });

  test("never exposes legacy promotion branding or destinations", () => {
    expect(brandPromotion({
      id: 1,
      title: "Много лосося — удовольствие есть",
      image: "https://example.com/legacy.jpg",
      cta: "Подробнее",
      ctaUrl: "https://t.me/mnogolososya",
    }, "https://nakta.example/story.png")).toEqual({
      id: 1,
      title: "Накта суши — удовольствие есть",
      image: "https://nakta.example/story.png",
      cta: "Подробнее",
      ctaUrl: "/support",
    });
  });

  test("normalizes Photon results and rejects places outside the selected city", () => {
    expect(photonFeatureToSuggestion({
      geometry: { coordinates: [74.6120461, 42.8518626] },
      properties: {
        osm_id: 50,
        street: "Медерова улица",
        housenumber: "50",
        city: "Бишкек",
        district: "Октябрьский район",
      },
    }, "bishkek")).toMatchObject({
      label: "Медерова улица, 50",
      subtitle: "Бишкек, Октябрьский район",
      latitude: 42.8518626,
      longitude: 74.6120461,
      kind: "house",
      precision: "exact",
      isComplete: true,
    });
    expect(photonFeatureToSuggestion({
      geometry: { coordinates: [37.6176, 55.7558] },
      properties: { street: "Тверская улица", city: "Москва" },
    }, "bishkek")).toBeNull();
  });

  test("does not reuse a saved point from another city on the map", () => {
    expect(isPointInRegionBounds("osh", 40.513, 72.8161)).toBe(true);
    expect(isPointInRegionBounds("osh", 42.851968, 74.624326)).toBe(false);
    expect(isPointInRegionBounds("bishkek", 40.513, 72.8161)).toBe(false);
    expect(isPointInRegionBounds("otuz-adyr", 40.606046, 72.966095)).toBe(true);
    expect(isPointInRegionBounds("otuz-adyr", 40.513, 72.8161)).toBe(false);
  });

  test("allows a live device point outside the selected delivery region", () => {
    expect(isUsableInitialMapPoint("osh", 42.851968, 74.624326)).toBe(false);
    expect(isUsableInitialMapPoint("osh", 42.851968, 74.624326, true)).toBe(true);
  });

  test("requires a house-level address before the delivery flow can continue", () => {
    expect(isSpecificDeliveryAddress("улица Медерова, 50", "house", "exact")).toBe(true);
    expect(isSpecificDeliveryAddress("улица Медерова", "street", "street")).toBe(false);
    expect(isSpecificDeliveryAddress("Октябрьский район", "district", "other")).toBe(false);
    expect(isSpecificDeliveryAddress("7 микрорайон", "", "")).toBe(false);
  });

  test("prefers the server-side Yandex geocoder without exposing its key", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        suggestions: [{
          id: "74.624326:42.851968:0",
          label: "улица Медерова, 41",
          subtitle: "Октябрьский район, Бишкек",
          latitude: 42.851968,
          longitude: 74.624326,
          kind: "house",
          precision: "exact",
          isComplete: true,
        }],
      }),
    } as Response);

    await expect(suggestAddresses("Медерова 41", "bishkek")).resolves.toEqual([
      expect.objectContaining({
        label: "улица Медерова, 41",
        isComplete: true,
      }),
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("https://naktasushi.com/api/geocode?"),
      expect.objectContaining({
        headers: { Accept: "application/json" },
      }),
    );
    fetchMock.mockRestore();
  });

  test("accepts the currently deployed geocoder item contract during rollout", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{
          address: "Кыргызстан, Бишкек, улица Медерова, 41",
          coordinates: [42.851968, 74.624326],
          kind: "house",
          precision: "exact",
          name: "улица Медерова, 41",
          description: "Бишкек, Кыргызстан",
        }],
      }),
    } as Response);

    await expect(suggestAddresses("Медерова 41", "bishkek")).resolves.toEqual([
      expect.objectContaining({
        label: "улица Медерова, 41",
        latitude: 42.851968,
        longitude: 74.624326,
        isComplete: true,
      }),
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("text="),
      expect.any(Object),
    );
    fetchMock.mockRestore();
  });

  test("does not replace an empty Yandex result with an inaccurate third-party fallback", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ suggestions: [], items: [] }),
    } as Response);

    await expect(suggestAddresses("Несуществующая улица", "bishkek")).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("https://naktasushi.com/api/geocode?"),
      expect.any(Object),
    );
    fetchMock.mockRestore();
  });

  test("map fallback remains interactive without a Yandex API key", () => {
    const html = createYandexMapHtml(
      { mapsApiKey: "", suggestApiKey: "" },
      "bishkek",
    );
    expect(html).toContain("leaflet@1.9.4");
    expect(html).toContain('map.on("click"');
    expect(html).toContain("photon.komoot.io/reverse");
    expect(html).toContain("isComplete: Boolean(houseNumber)");
    expect(html).not.toContain('class="pin"');
    expect(html).not.toContain("yandex.com/map-widget");
    expect(html).toContain("window.L.polygon");
  });

  test("uses the configured city polygon for delivery validation", () => {
    const zone = getDeliveryZone("osh", [
      { latitude: 40, longitude: 72 },
      { latitude: 41, longitude: 72 },
      { latitude: 41, longitude: 73 },
      { latitude: 40, longitude: 73 },
    ]);
    expect(isPointInDeliveryZone(40.5, 72.5, zone)).toBe(true);
    expect(isPointInDeliveryZone(41.5, 72.5, zone)).toBe(false);
  });

  test("ignores stale coordinates outside the selected delivery city", () => {
    const html = createYandexMapHtml(
      { mapsApiKey: "maps-key", suggestApiKey: "suggest-key" },
      "bishkek",
      37.4219983,
      -122.084,
    );
    expect(html).toContain("const initialCenter = [42.851968,74.624326]");
    expect(html).not.toContain("[37.4219983,-122.084]");
  });

  test("preserves geocoder quality in map messages", () => {
    expect(parseMapMessage(JSON.stringify({
      source: "losos-yandex-map",
      type: "location",
      address: "улица Медерова, 50",
      latitude: 42.8518626,
      longitude: 74.6120461,
      kind: "house",
      precision: "exact",
      isComplete: true,
    }))).toMatchObject({
      address: "улица Медерова, 50",
      kind: "house",
      precision: "exact",
      isComplete: true,
    });
  });

  test("accepts checkout success only for a valid persisted order receipt", () => {
    expect(isPersistedOrderReceipt({
      id: "12345678-order",
      status: "new",
      total: 510,
    })).toBe(true);
    expect(isPersistedOrderReceipt({
      id: "12345678-order",
      status: "confirmed",
      total: 510,
    })).toBe(true);
    expect(isPersistedOrderReceipt({ id: "short", status: "new", total: 510 })).toBe(false);
    expect(isPersistedOrderReceipt(null)).toBe(false);
  });

  test("search query results are flat and do not expose category headings", () => {
    const found = { ...product, id: 12, name: "Битые огурцы" };
    const groups = groupSearchResults([found], null, [{
      id: 1,
      slug: "salads",
      title: "Салаты",
      products: [found],
    }]);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe("");
    expect(groups[0].products).toEqual([found]);
  });
});
