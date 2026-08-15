import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { authApi } from "../api";
import { OrderDetailsScreen } from "../screens/OrderDetailsScreen";
import { useStore } from "../store";
import type { ProfileOrderDetail } from "../types";

jest.mock("../api", () => ({
  authApi: {
    cancelOrder: jest.fn(),
    order: jest.fn(),
  },
  WEB_URL: "https://example.test",
}));

jest.mock("../store", () => ({
  useStore: jest.fn(),
}));

jest.mock("../pushNotifications", () => ({
  presentPolledOrderStatus: jest.fn(),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("expo-notifications", () => ({
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 48, right: 0, bottom: 24, left: 0 }),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
}));

describe("OrderDetailsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows the compact order summary cards", async () => {
    (useStore as jest.Mock).mockReturnValue({
      session: {
        phone: "+996555123456",
        verificationToken: "token",
        expiresAt: Date.now() + 60_000,
      },
    });
    (authApi.order as jest.Mock).mockResolvedValue({
      id: "5f2334-order",
      total: 3145,
      subtotal: 3145,
      status: "new",
      deliveryType: "delivery",
      createdAt: "2026-08-02T08:02:00.000Z",
      address: "Предгорный переулок, 25",
      apartment: "12",
      entrance: "2",
      floor: "5",
      intercom: "",
      comment: "",
      utensilsCount: 1,
      noUtensils: false,
      paymentMethod: "cash",
      posStatus: "partially_rejected",
      posSyncStatus: "synced",
      posProgress: { itemsTotal: 2, itemsReady: 1, itemsRejected: 1 },
      items: [{
        productName: "Шаурокинава",
        quantity: 1,
        lineTotal: 405,
        modifierSnapshots: [],
        posStatus: "rejected",
        posReadyQuantity: 0,
        posRejectReason: "Закончился лосось",
      }],
    } satisfies ProfileOrderDetail);

    const screen = await render(
      <OrderDetailsScreen onBack={jest.fn()} orderId="5f2334-order" />,
    );

    expect(await screen.findByText("Некоторые блюда недоступны")).toBeTruthy();
    expect(screen.getByText("Готово 1 из 2 блюд")).toBeTruthy();
    expect(screen.getByText("Отклонено: 1")).toBeTruthy();
    expect(screen.getByText("Отклонено: Закончился лосось")).toBeTruthy();
    expect(screen.getByText("Состав заказа")).toBeTruthy();
    expect(screen.getByText("Шаурокинава")).toBeTruthy();
    expect(screen.getByText("3 145 С")).toBeTruthy();
    expect(screen.getByText("Предгорный переулок, 25")).toBeTruthy();
    expect(screen.getByText("Наличными")).toBeTruthy();
    expect(screen.getByText("Приборы: 1")).toBeTruthy();
    expect(screen.getByLabelText("Связаться с поддержкой")).toBeTruthy();
    expect(screen.queryByText("Отменить заказ")).toBeNull();
  });

  test("cancels a new order only after explicit confirmation", async () => {
    const session = {
      phone: "+996555123456",
      verificationToken: "token",
      expiresAt: Date.now() + 60_000,
    };
    (useStore as jest.Mock).mockReturnValue({ session });
    (authApi.order as jest.Mock).mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      orderNumber: 172,
      total: 980,
      subtotal: 980,
      status: "new",
      deliveryType: "delivery",
      createdAt: "2026-08-16T08:02:00.000Z",
      address: "Бишкек",
      apartment: "",
      entrance: "",
      floor: "",
      intercom: "",
      comment: "",
      utensilsCount: 1,
      noUtensils: false,
      paymentMethod: "cash",
      posStatus: null,
      posSyncStatus: "pending",
      posProgress: { itemsTotal: 0, itemsReady: 0, itemsRejected: 0 },
      items: [],
    } satisfies ProfileOrderDetail);
    (authApi.cancelOrder as jest.Mock).mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      status: "cancelled",
    });

    const screen = await render(
      <OrderDetailsScreen
        onBack={jest.fn()}
        orderId="11111111-1111-4111-8111-111111111111"
      />,
    );

    fireEvent.press(await screen.findByText("Отменить заказ"));
    expect(await screen.findByText("Отменить заказ?")).toBeTruthy();
    expect(screen.getByText("После отмены восстановить заказ не получится.")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText("Да, отменить"));
      await Promise.resolve();
    });

    await waitFor(() => expect(authApi.cancelOrder).toHaveBeenCalledWith(
      session,
      "11111111-1111-4111-8111-111111111111",
    ));
    expect(await screen.findByText("Заказ отменён")).toBeTruthy();
    expect(screen.queryByText("Отменить заказ")).toBeNull();
  });
});
