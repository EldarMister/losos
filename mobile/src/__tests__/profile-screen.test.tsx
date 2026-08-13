import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { authApi } from "../api";
import { ProfileScreen, profileCoinHistory } from "../screens/ProfileScreen";
import { useStore } from "../store";
import type { ProfileData } from "../types";

jest.mock("../api", () => ({
  authApi: {
    order: jest.fn(),
    profile: jest.fn(),
    deleteAccount: jest.fn(),
  },
}));

jest.mock("../store", () => ({
  useStore: jest.fn(),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("expo-notifications", () => ({
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
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

  test("normalizes server coin transactions and never hides a positive balance", () => {
    expect(profileCoinHistory({
      ...emptyProfile,
      naktaCoins: 42,
      naktaCoinHistory: [{
        id: "coin-1",
        amount: 9,
        createdAt: "2026-08-01T10:00:00.000Z",
        description: "Заказ №ABCDEF",
        orderId: "abcdef",
      }],
    })).toEqual([expect.objectContaining({ amount: 9, orderId: "abcdef" })]);
    expect(profileCoinHistory({ ...emptyProfile, naktaCoins: 42 })).toEqual([
      expect.objectContaining({ amount: 42, description: "Начислено за предыдущие заказы" }),
    ]);
  });

  test("shows coin accrual history for a positive balance", async () => {
    (authApi.profile as jest.Mock).mockResolvedValue({ ...emptyProfile, naktaCoins: 42 });
    const screen = await render(
      <ProfileScreen
        onBack={jest.fn()}
        onLogout={jest.fn()}
        onOpenOrder={jest.fn()}
        section="balance"
      />,
    );

    expect(await screen.findByText("Начислено за предыдущие заказы")).toBeTruthy();
    expect(screen.getByText("+42")).toBeTruthy();
    expect(screen.queryByText("История операций пока пуста.")).toBeNull();
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
        orderNumber: 1424,
        total: 1290,
        status: "preparing",
        deliveryType: "delivery",
        createdAt: "2026-07-31T08:00:00.000Z",
        address: "переулок Токолдош, 61",
      }],
      orderHistory: [{
        id: "fedcba-history",
        total: 850,
        status: "completed",
        deliveryType: "pickup",
        createdAt: "2026-07-25T08:00:00.000Z",
        address: "улица 7 Апреля, 2Б",
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

    await fireEvent.press(await screen.findByLabelText("Заказ №1424"));
    expect(onOpenOrder).toHaveBeenCalledWith("abcdef-current");
    expect(screen.getByText("переулок Токолдош, 61")).toBeTruthy();

    await fireEvent.press(screen.getByText("История"));
    expect(screen.getByText("Выполнен")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Заказ №FEDCBA"));
    expect(onOpenOrder).toHaveBeenCalledWith("fedcba-history");
  });

  test("deletes the account only after destructive confirmation", async () => {
    (authApi.profile as jest.Mock).mockResolvedValue(emptyProfile);
    (authApi.deleteAccount as jest.Mock).mockResolvedValue({ deleted: true });
    const onAccountDeleted = jest.fn();
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const screen = await render(
      <ProfileScreen
        onAccountDeleted={onAccountDeleted}
        onBack={jest.fn()}
        onLogout={jest.fn()}
        onOpenOrder={jest.fn()}
        section="settings"
      />,
    );

    await fireEvent.press(await screen.findByText("Удалить аккаунт"));
    expect(authApi.deleteAccount).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0]?.[2] || [];
    const destructive = buttons.find((button) => button.style === "destructive");
    await act(async () => {
      destructive?.onPress?.();
    });

    await waitFor(() => expect(authApi.deleteAccount).toHaveBeenCalledTimes(1));
    expect(onAccountDeleted).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });
});
