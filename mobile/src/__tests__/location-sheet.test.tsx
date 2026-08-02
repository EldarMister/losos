import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Location from "expo-location";
import { catalogApi } from "../api";
import {
  LocationSheet,
  pickupIntroCopy,
  regionPickupLocations,
} from "../components/LocationSheet";
import { useStore } from "../store";
import type { Region } from "../types";

const mockYandexMap = jest.fn((_props: unknown) => null);

jest.mock("../api", () => ({
  catalogApi: {
    regions: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("../store", () => ({
  useStore: jest.fn(),
}));

jest.mock("../components/YandexMap", () => ({
  YandexMap: (props: unknown) => mockYandexMap(props),
}));

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3, High: 4 },
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied" }),
  getLastKnownPositionAsync: jest.fn().mockResolvedValue(null),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 48, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
}));

type StoreMock = {
  deliveryType: "delivery" | "pickup";
  location: {
    address: string;
    latitude: number;
    longitude: number;
    pickupLocationId?: number;
  };
  regions: Array<{
    id: number;
    slug: string;
    name: string;
    pickupLocations: Array<{
      id: number;
      title: string;
      address: string;
      workingHours: string;
      latitude: number;
      longitude: number;
      yandexUrl?: string;
      enabled: boolean;
      sortOrder: number;
    }>;
    pickupAddress?: string;
    pickupWorkingHours?: string;
    pickupYandexUrl?: string;
  }>;
  regionSlug: string;
  setDeliveryType: jest.Mock;
  setRegionSlug: jest.Mock;
  setLocation: jest.Mock;
  setRegions: jest.Mock;
};

function makeStore(address: string): StoreMock {
  return {
    deliveryType: "delivery",
    location: {
      address,
      latitude: 42.851968,
      longitude: 74.624326,
    },
    regions: [{
      id: 1,
      slug: "bishkek",
      name: "Бишкек",
      pickupLocations: [],
    }],
    regionSlug: "bishkek",
    setDeliveryType: jest.fn(),
    setRegionSlug: jest.fn(),
    setLocation: jest.fn(),
    setRegions: jest.fn(),
  };
}

describe("LocationSheet delivery address workflow", () => {
  test("shows an honest unavailable state instead of six hardcoded kitchens", async () => {
    const store = makeStore("улица Медерова, 41");
    (catalogApi.regions as jest.Mock).mockResolvedValue(store.regions);
    (useStore as jest.Mock).mockReturnValue(store);
    const screen = await render(<LocationSheet visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByText("Самовывоз"));

    expect(await screen.findByText(
      "Сейчас для самовывоза нет доступных кухонь. Загляните сюда немного позже.",
    )).toBeTruthy();
    expect(screen.getByLabelText("Список").props.accessibilityState?.disabled).toBe(true);
    expect(screen.queryByText(/6 кухнях/)).toBeNull();
    expect(screen.getByLabelText("Корзина самовывоза").props.source).toBe(
      require("../../assets/корзина.png"),
    );
    expect(screen.getByTestId("location-main-panel").props.onGestureHandlerEvent)
      .toBeUndefined();
  });

  test("filters and sorts pickup locations from the API", () => {
    const region = {
      id: 1,
      slug: "bishkek",
      name: "Бишкек",
      pickupLocations: [
        { id: 2, title: "Вторая", address: "B", workingHours: "", enabled: true, sortOrder: 20 },
        { id: 3, title: "Скрытая", address: "C", workingHours: "", enabled: false, sortOrder: 0 },
        { id: 1, title: "Первая", address: "A", workingHours: "", enabled: true, sortOrder: 10 },
      ],
    } as Region;

    expect(regionPickupLocations(region).map((item) => item.id)).toEqual([1, 2]);
    expect(pickupIntroCopy(1)).toContain("1 кухне");
    expect(pickupIntroCopy(2)).toContain("2 кухнях");
  });

  test("keeps a configured legacy pickup address as one real location", () => {
    const region = {
      id: 7,
      slug: "osh",
      name: "Ош",
      pickupAddress: "улица Курманжан Датки, 123",
      pickupWorkingHours: "Ежедневно, 11:00–22:00",
      pickupYandexUrl: "https://yandex.ru/maps/example",
      pickupLocations: [],
    } as Region;

    expect(regionPickupLocations(region)).toEqual([expect.objectContaining({
      id: -7,
      address: "улица Курманжан Датки, 123",
      workingHours: "Ежедневно, 11:00–22:00",
      yandexUrl: "https://yandex.ru/maps/example",
    })]);
  });

  test("opens an empty manual search for an incomplete street address", async () => {
    const store = makeStore("улица Медерова");
    (useStore as jest.Mock).mockReturnValue(store);
    const onClose = jest.fn();
    const screen = await render(
      <LocationSheet visible onClose={onClose} />,
    );

    const refine = await screen.findByLabelText("Уточнить адрес");
    await fireEvent.press(refine);

    const searchInput = await screen.findByPlaceholderText("Введите адрес");
    expect(searchInput.props.value).toBe("");
    expect(searchInput.props.autoFocus).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  test("continues immediately for a house-level address", async () => {
    const store = makeStore("улица Медерова, 41");
    (useStore as jest.Mock).mockReturnValue(store);
    const onClose = jest.fn();
    const screen = await render(
      <LocationSheet visible onClose={onClose} />,
    );

    await fireEvent.press(await screen.findByLabelText("Далее"));

    await waitFor(() => {
      expect(store.setLocation).toHaveBeenCalledWith(expect.objectContaining({
        address: "улица Медерова, 41",
        latitude: 42.851968,
        longitude: 74.624326,
      }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test("uses the original pickup flow: intro, kitchen list, then details", async () => {
    const store = makeStore("улица Медерова, 41");
    store.regions[0].pickupLocations = [{
      id: 17,
      title: "Кухня на Медерова",
      address: "улица Медерова, 41",
      workingHours: "Ежедневно, 11:00–23:00",
      latitude: 42.851968,
      longitude: 74.624326,
      enabled: true,
      sortOrder: 0,
    }];
    (catalogApi.regions as jest.Mock).mockResolvedValue(store.regions);
    (useStore as jest.Mock).mockReturnValue(store);
    const onClose = jest.fn();
    const screen = await render(<LocationSheet visible onClose={onClose} />);

    fireEvent.press(screen.getByText("Самовывоз"));
    expect(await screen.findByText("Самовывоз")).toBeTruthy();
    expect(screen.getByLabelText("Корзина самовывоза")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Список"));
    expect(await screen.findByText("Выберите кухню для самовывоза")).toBeTruthy();
    expect(
      screen.getByTestId("pickup-list-panel").props.onGestureHandlerEvent,
    ).toBeUndefined();

    fireEvent.press(screen.getByLabelText("улица Медерова, 41"));
    fireEvent.press(screen.getByLabelText("Выбрать"));
    expect(await screen.findByText("Ежедневно, 11:00–23:00")).toBeTruthy();
    expect(screen.getByLabelText("Маршрут")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Заберу здесь"));
    await waitFor(() => {
      expect(store.setLocation).toHaveBeenCalledWith(expect.objectContaining({
        address: "улица Медерова, 41",
        pickupLocationId: 17,
      }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test("keeps the delivery coordinates after previewing a pickup kitchen", async () => {
    const store = makeStore("улица Медерова, 41");
    store.regions[0].pickupLocations = [{
      id: 17,
      title: "Кухня на Медерова",
      address: "улица Киевская, 120",
      workingHours: "Ежедневно, 11:00–23:00",
      latitude: 42.875,
      longitude: 74.603,
      enabled: true,
      sortOrder: 0,
    }];
    (catalogApi.regions as jest.Mock).mockResolvedValue(store.regions);
    (useStore as jest.Mock).mockReturnValue(store);
    const screen = await render(<LocationSheet visible onClose={jest.fn()} />);

    await fireEvent.press(screen.getByText("Самовывоз"));
    await fireEvent.press(await screen.findByLabelText("Список"));
    await fireEvent.press(await screen.findByLabelText("улица Киевская, 120"));
    await waitFor(() => {
      expect(screen.getByLabelText("Выбрать").props.accessibilityState?.disabled).toBeFalsy();
    });
    await fireEvent.press(screen.getByLabelText("Выбрать"));
    await waitFor(() => {
      expect(screen.queryByLabelText("Закрыть список кухонь")).toBeNull();
    });
    await fireEvent.press(screen.getByText("Доставка"));
    await fireEvent.press(await screen.findByLabelText("Далее"));

    expect(store.setLocation).toHaveBeenCalledWith(expect.objectContaining({
      address: "улица Медерова, 41",
      latitude: 42.851968,
      longitude: 74.624326,
      pickupLocationId: undefined,
    }));
  });

  test("calculates pickup distance from the device instead of the saved delivery address", async () => {
    const store = makeStore("улица Медерова, 41");
    store.regions[0].pickupLocations = [{
      id: 17,
      title: "Кухня на Медерова",
      address: "улица Медерова, 41",
      workingHours: "Ежедневно, 11:00–23:00",
      latitude: 42.851968,
      longitude: 74.624326,
      enabled: true,
      sortOrder: 0,
    }];
    (catalogApi.regions as jest.Mock).mockResolvedValue(store.regions);
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 42.87, longitude: 74.6 },
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 42.87, longitude: 74.6 },
    });
    (useStore as jest.Mock).mockReturnValue(store);
    const screen = await render(<LocationSheet visible onClose={jest.fn()} />);

    await act(async () => {
      fireEvent.press(screen.getByText("Самовывоз"));
      await Promise.resolve();
      await Promise.resolve();
    });
    fireEvent.press(await screen.findByLabelText("Список"));

    expect(await screen.findByText("2.8 км", {}, { timeout: 2_000 })).toBeTruthy();
    expect(screen.queryByText("0 м")).toBeNull();
  });

  test("moves the map to GPS and takes the address from the centered map marker", async () => {
    const store = makeStore("улица Медерова, 41");
    (useStore as jest.Mock).mockReturnValue(store);
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 42.8752, longitude: 74.6037 },
    });
    (Location.reverseGeocodeAsync as jest.Mock).mockClear();
    mockYandexMap.mockClear();
    const screen = await render(<LocationSheet visible onClose={jest.fn()} />);

    await fireEvent.press(screen.getByLabelText("Использовать текущее местоположение"));

    await waitFor(() => {
      const props = mockYandexMap.mock.calls.at(-1)?.[0] as {
        focusRequest: number;
        initialLatitude: number;
        initialLongitude: number;
      };
      expect(props).toMatchObject({
        focusRequest: 1,
        initialLatitude: 42.8752,
        initialLongitude: 74.6037,
      });
      expect(screen.getByText("Определяем адрес…")).toBeTruthy();
    });

    const props = mockYandexMap.mock.calls.at(-1)?.[0] as {
      onLocationChange: (point: {
        address: string;
        latitude: number;
        longitude: number;
        kind: string;
        precision: string;
        isComplete: boolean;
      }) => void;
    };
    await act(async () => {
      props.onLocationChange({
        address: "улица Киевская, 120",
        latitude: 42.8752,
        longitude: 74.6037,
        kind: "house",
        precision: "exact",
        isComplete: true,
      });
    });

    expect(screen.getByText("улица Киевская, 120")).toBeTruthy();
    expect(Location.reverseGeocodeAsync).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText("Использовать текущее местоположение"));
    await waitFor(() => {
      const repeatedProps = mockYandexMap.mock.calls.at(-1)?.[0] as { focusRequest: number };
      expect(repeatedProps.focusRequest).toBe(2);
    });
  });
});
