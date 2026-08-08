import { render } from "@testing-library/react-native";
import { authApi } from "../api";
import { OrderDetailsScreen } from "../screens/OrderDetailsScreen";
import { useStore } from "../store";
import type { ProfileOrderDetail } from "../types";

jest.mock("../api", () => ({
  authApi: {
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
      items: [{
        productName: "Шаурокинава",
        quantity: 1,
        lineTotal: 405,
        modifierSnapshots: [],
      }],
    } satisfies ProfileOrderDetail);

    const screen = await render(
      <OrderDetailsScreen onBack={jest.fn()} orderId="5f2334-order" />,
    );

    expect(await screen.findByText("Заказ принят")).toBeTruthy();
    expect(screen.getByText("Состав заказа")).toBeTruthy();
    expect(screen.getByText("Шаурокинава")).toBeTruthy();
    expect(screen.getByText("3 145 С")).toBeTruthy();
    expect(screen.getByText("Предгорный переулок, 25")).toBeTruthy();
    expect(screen.getByText("Наличными")).toBeTruthy();
    expect(screen.getByText("Приборы: 1")).toBeTruthy();
    expect(screen.getByLabelText("Связаться с поддержкой")).toBeTruthy();
  });
});
