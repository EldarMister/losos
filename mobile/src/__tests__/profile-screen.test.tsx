import { fireEvent, render } from "@testing-library/react-native";
import { authApi } from "../api";
import { ProfileScreen } from "../screens/ProfileScreen";
import { useStore } from "../store";
import type { ProfileData } from "../types";

jest.mock("../api", () => ({
  authApi: {
    profile: jest.fn(),
  },
}));

jest.mock("../store", () => ({
  useStore: jest.fn(),
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

const emptyProfile: ProfileData = {
  naktaCoins: 0,
  currentOrders: [],
  orderHistory: [],
};

describe("ProfileScreen order history", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as jest.Mock).mockReturnValue({
      session: {
        phone: "+996555123456",
        verificationToken: "token",
        expiresAt: Date.now() + 60_000,
      },
    });
  });

  test("uses the original empty-order structure and returns to the menu", async () => {
    (authApi.profile as jest.Mock).mockResolvedValue(emptyProfile);
    const onBack = jest.fn();
    const screen = await render(
      <ProfileScreen
        onBack={onBack}
        onLogout={jest.fn()}
        onOpenOrder={jest.fn()}
        section="orders"
      />,
    );

    expect(await screen.findByText("Мои заказы")).toBeTruthy();
    expect(
      screen.getByText("Пока здесь пусто,\nпора сделать первый заказ!"),
    ).toBeTruthy();
    await fireEvent.press(screen.getByText("Меню"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test("opens both a current and a completed order from large order cards", async () => {
    (authApi.profile as jest.Mock).mockResolvedValue({
      naktaCoins: 42,
      currentOrders: [{
        id: "abcdef-current",
        total: 1290,
        status: "preparing",
        deliveryType: "delivery",
        createdAt: "2026-07-31T08:00:00.000Z",
      }],
      orderHistory: [{
        id: "fedcba-history",
        total: 850,
        status: "completed",
        deliveryType: "pickup",
        createdAt: "2026-07-25T08:00:00.000Z",
      }],
    } satisfies ProfileData);
    const onOpenOrder = jest.fn();
    const screen = await render(
      <ProfileScreen
        onBack={jest.fn()}
        onLogout={jest.fn()}
        onOpenOrder={onOpenOrder}
        section="orders"
      />,
    );

    await fireEvent.press(await screen.findByLabelText("Заказ №ABCDEF"));
    expect(onOpenOrder).toHaveBeenCalledWith("abcdef-current");
    expect(screen.getByText("Выполнен")).toBeTruthy();
  });
});
