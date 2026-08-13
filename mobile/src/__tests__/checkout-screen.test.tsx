import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { ordersApi } from "../api";
import { CheckoutScreen } from "../screens/CheckoutScreen";
import { useStore } from "../store";

jest.mock("../api", () => ({
  ordersApi: {
    create: jest.fn(),
  },
}));

jest.mock("../store", () => ({
  useStore: jest.fn(),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 24, left: 0 }),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
}));

describe("CheckoutScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as jest.Mock).mockReturnValue({
      cart: [{
        key: "line-1",
        product: { id: 17, name: "Ролл", price: 980 },
        quantity: 1,
        modifiers: [],
      }],
      cartTotal: 980,
      clearCart: jest.fn(),
      deliveryType: "delivery",
      location: {
        address: "переулок Токолдош, 61",
        latitude: 42.85,
        longitude: 74.61,
      },
      noUtensils: false,
      activeRegion: {
        id: 1,
        slug: "bishkek",
        name: "Бишкек",
        deliveryIs24Hours: true,
      },
      regionSlug: "bishkek",
      session: {
        phone: "+996220203021",
        verificationToken: "verified-token",
      },
      utensilsCount: 2,
    });
    (ordersApi.create as jest.Mock).mockResolvedValue({
      id: "order-12345678",
      status: "new",
      total: 980,
    });
  });

  test("matches the compact checkout structure and submits its fields", async () => {
    const store = (useStore as jest.Mock)();
    const onOpenLocation = jest.fn();
    const onSuccess = jest.fn();
    const screen = await render(
      <CheckoutScreen
        onBack={jest.fn()}
        onOpenLocation={onOpenLocation}
        onSuccess={onSuccess}
      />,
    );

    expect(screen.getByText("Доставка")).toBeTruthy();
    expect(screen.getByText("переулок Токолдош, 61")).toBeTruthy();
    expect(screen.getByLabelText("Квартира")).toBeTruthy();
    expect(screen.getByLabelText("Подъезд")).toBeTruthy();
    expect(screen.getByLabelText("Этаж")).toBeTruthy();
    expect(screen.getByDisplayValue("+996 220 20 30 21")).toBeTruthy();
    expect(screen.getByPlaceholderText("Имя")).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByLabelText("Имя").props.style).fontSize).toBe(16);
    expect(StyleSheet.flatten(screen.getByLabelText("Телефон").props.style).fontSize).toBe(16);
    expect(screen.getByLabelText("Наличными").props.accessibilityState.checked).toBe(true);
    expect(screen.getByText("Наличными").props.numberOfLines).toBe(1);
    expect(screen.queryByText("Комплектация")).toBeNull();
    expect(screen.getByText(/Оформляя заказ, вы принимаете/)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Выбрать адрес на карте"));
    expect(onOpenLocation).toHaveBeenCalledTimes(1);
    await fireEvent.changeText(screen.getByLabelText("Имя"), "Элдар");
    await fireEvent.changeText(screen.getByLabelText("Телефон"), "+996 555 12 34 56");
    await fireEvent.changeText(screen.getByLabelText("Квартира"), "12");
    await fireEvent.changeText(screen.getByLabelText("Подъезд"), "2");
    await fireEvent.changeText(screen.getByLabelText("Этаж"), "5");
    await fireEvent.changeText(screen.getByLabelText("Комментарий"), "Позвонить заранее");
    await fireEvent.press(screen.getByLabelText("Картой"));
    await fireEvent.press(screen.getByText("Заказать"));

    await waitFor(() => {
      expect(ordersApi.create).toHaveBeenCalledWith(expect.objectContaining({
        address: "переулок Токолдош, 61",
        apartment: "12",
        comment: "Позвонить заранее",
        customerName: "Элдар",
        entrance: "2",
        floor: "5",
        intercom: "",
        paymentMethod: "card",
        phone: "+996555123456",
        utensilsCount: 2,
      }));
      expect(store.clearCart).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: "order-12345678" }));
    });
  });

  test("keeps the +996 country prefix while the customer edits the number", async () => {
    const screen = await render(
      <CheckoutScreen
        onBack={jest.fn()}
        onOpenLocation={jest.fn()}
        onSuccess={jest.fn()}
      />,
    );

    const phone = screen.getByLabelText("Телефон");
    await fireEvent.changeText(phone, "");
    expect(screen.getByDisplayValue("+996 ")).toBeTruthy();

    await fireEvent.changeText(phone, "555123456");
    expect(screen.getByDisplayValue("+996 555 12 34 56")).toBeTruthy();
  });

  test("explains why checkout cannot be submitted instead of silently disabling the button", async () => {
    const screen = await render(
      <CheckoutScreen
        onBack={jest.fn()}
        onOpenLocation={jest.fn()}
        onSuccess={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByText("Заказать"));

    expect(screen.getByText("Укажите имя получателя")).toBeTruthy();
    expect(ordersApi.create).not.toHaveBeenCalled();
  });
});
