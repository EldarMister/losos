import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { LocationSheet } from "../components/LocationSheet";
import { useStore } from "../store";

jest.mock("../api", () => ({
  catalogApi: {
    regions: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("../store", () => ({
  useStore: jest.fn(),
}));

jest.mock("../components/YandexMap", () => ({
  YandexMap: () => null,
}));

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
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
  deliveryType: "delivery";
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  regions: Array<{
    id: number;
    slug: string;
    name: string;
    pickupLocations: never[];
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
    expect(searchInput.props.autoFocus).toBeUndefined();
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
});
