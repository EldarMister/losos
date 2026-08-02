import { fireEvent, render } from "@testing-library/react-native";
import { CartSheet } from "../components/CartSheet";
import { useStore } from "../store";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("../api", () => ({
  catalogApi: {
    categories: jest.fn().mockResolvedValue([]),
  },
  resolveImageUrl: (value: string) => value,
}));

jest.mock("../store", () => ({
  lineTotal: () => 400,
  useStore: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
}));

const product = {
  id: 1,
  slug: "roll",
  name: "Ролл",
  price: 400,
  image: "https://example.com/roll.png",
};

function makeStore() {
  return {
    activeRegion: {
      deliveryIs24Hours: false,
      deliveryOpenTime: "11:00",
      deliveryCloseTime: "23:00",
      freeDeliveryThreshold: 1_000,
    },
    addCartLine: jest.fn(),
    cart: [{
      key: "1",
      product,
      quantity: 1,
      modifiers: [],
    }],
    cartTotal: 400,
    clearCart: jest.fn(),
    deliveryType: "delivery",
    noUtensils: false,
    regionSlug: "bishkek",
    setCartQuantity: jest.fn(),
    setNoUtensils: jest.fn(),
    setUtensilsCount: jest.fn(),
    utensilsCount: 1,
  };
}

describe("CartSheet configuration draft", () => {
  test("does not persist kit changes on cancel and saves them explicitly", async () => {
    const store = makeStore();
    (useStore as jest.Mock).mockReturnValue(store);
    const screen = await render(
      <CartSheet
        onCheckout={jest.fn()}
        onClose={jest.fn()}
        visible
      />,
    );

    await fireEvent.press(screen.getByText("Управлять"));
    expect(screen.getByText("Бесплатно")).toBeTruthy();
    expect(screen.getByText("Васаби")).toBeTruthy();
    expect(screen.getByText("Соус соевый")).toBeTruthy();
    expect(screen.getByText("Имбирь")).toBeTruthy();
    await fireEvent(screen.getByRole("switch"), "valueChange", true);
    expect(screen.getByText("0 шт")).toBeTruthy();
    await fireEvent.press(screen.getByText("Отмена"));

    expect(store.setNoUtensils).not.toHaveBeenCalled();
    expect(store.setUtensilsCount).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText("Управлять"));
    await fireEvent(screen.getByRole("switch"), "valueChange", true);
    await fireEvent.press(screen.getByText("Сохранить выбор"));

    expect(store.setNoUtensils).toHaveBeenCalledWith(true);
    expect(store.setUtensilsCount).toHaveBeenCalledWith(1);
  });

  test("opens toppings above the configuration sheet", async () => {
    const store = makeStore();
    (useStore as jest.Mock).mockReturnValue(store);
    const screen = await render(
      <CartSheet
        onCheckout={jest.fn()}
        onClose={jest.fn()}
        visible
      />,
    );

    await fireEvent.press(screen.getByText("Управлять"));
    await fireEvent.press(screen.getByLabelText("Открыть дополнения"));

    expect(screen.getByText("Будет сразу добавлено в корзину")).toBeTruthy();
    expect(screen.getByText("Бесплатно")).toBeTruthy();
    expect(screen.getByText("Назад")).toBeTruthy();
  });
});
