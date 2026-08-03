import { fireEvent, render } from "@testing-library/react-native";
import { catalogApi } from "../api";
import { ProductSheet } from "../components/ProductSheet";
import { useStore } from "../store";
import type { Product } from "../types";

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
  useStore: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
}));

const product: Product = {
  id: 1,
  slug: "roll",
  name: "Ролл",
  price: 400,
  image: "https://example.com/roll.png",
  modifierGroups: [{
    id: "toppings",
    title: "Дополнительный соус",
    selectionType: "multiple",
    presentation: "rows",
    required: false,
    items: [{
      id: "sweet-chili",
      name: "Сладкий чили",
      price: 100,
      image: "https://example.com/sauce.png",
    }],
  }],
};

describe("ProductSheet toppings", () => {
  beforeEach(() => {
    (catalogApi.categories as jest.Mock).mockResolvedValue([]);
  });

  test("adds a row topping when its plus is pressed", async () => {
    const addCartLine = jest.fn();
    (useStore as jest.Mock).mockReturnValue({ addCartLine });
    const screen = await render(
      <ProductSheet product={product} onClose={jest.fn()} />,
    );

    await fireEvent.press(screen.getAllByLabelText("Добавить Сладкий чили").at(-1)!);
    await fireEvent.press(screen.getByLabelText("Добавить, 500 С"));

    expect(addCartLine).toHaveBeenCalledWith(
      product,
      1,
      [expect.objectContaining({
        groupId: "toppings",
        itemId: "sweet-chili",
        quantity: 1,
      })],
    );
  });

  test("loads equipment photos from the full catalog, including Toppings", async () => {
    const equipment = [
      { id: 21, slug: "wasabi", name: "Васаби", price: 70, image: "wasabi.jpg" },
      { id: 22, slug: "soy", name: "Соус соевый", price: 70, image: "soy.jpg" },
      { id: 23, slug: "ginger", name: "Имбирь маринованный", price: 70, image: "ginger.jpg" },
    ];
    (catalogApi.categories as jest.Mock).mockResolvedValue([{
      id: 9,
      slug: "toppingi-9",
      title: "Топпинги",
      products: equipment,
    }]);
    (useStore as jest.Mock).mockReturnValue({
      addCartLine: jest.fn(),
      regionSlug: "bishkek",
    });
    const screen = await render(
      <ProductSheet
        product={{ ...product, composition: "Ролл, рис, нори", weight: 100 }}
        onClose={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByLabelText("Открыть комплектацию"));

    expect((await screen.findByLabelText("Фото: Васаби")).props.source).toEqual({ uri: "wasabi.jpg" });
    expect(screen.getByLabelText("Фото: Соус соевый").props.source).toEqual({ uri: "soy.jpg" });
    expect(screen.getByLabelText("Фото: Имбирь").props.source).toEqual({ uri: "ginger.jpg" });
  });
});
