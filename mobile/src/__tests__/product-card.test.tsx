import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ProductCard } from "../components/ProductCard";
import type { Product } from "../types";

describe("ProductCard images", () => {
  test("shows the coin reward configured for a product", async () => {
    const product = {
      id: 164,
      slug: "reward-roll",
      name: "Наградной ролл",
      image: "https://images.example.test/reward.png",
      price: 849,
      naktaCoins: 25,
      available: true,
      modifierGroups: [],
    } as Product;
    const screen = await render(
      <ProductCard onAdd={jest.fn()} onPress={jest.fn()} product={product} />,
    );

    expect(screen.getByLabelText("Начислим 25 NAKTA Coin")).toBeTruthy();
  });

  test("renders the product image immediately without a prefetch gate", async () => {
    const image = "https://images.example.test/product.JPEG";
    const product = {
      id: 165,
      slug: "shaurdelphia",
      name: "Шаурдельфия",
      image,
      price: 849,
      available: true,
      modifierGroups: [],
    } as Product;

    const screen = await render(
      <ProductCard
        onAdd={jest.fn()}
        onPress={jest.fn()}
        product={product}
      />,
    );

    expect(screen.getByTestId("product-image-165").props.source).toEqual({ uri: image });
  });

  test("switches Yandex hosts and retries after an image error", async () => {
    const product = {
      id: 300,
      slug: "product-300",
      name: "Блюдо 300",
      image: "https://thapl-public.storage.yandexcloud.net/folder/product.JPEG",
      price: 500,
      available: true,
      modifierGroups: [],
    } as Product;

    const screen = await render(
      <ProductCard onAdd={jest.fn()} onPress={jest.fn()} product={product} />,
    );

    fireEvent(screen.getByTestId("product-image-300"), "onError");
    await waitFor(() => {
      expect(screen.getByTestId("product-image-300").props.source.uri).toBe(
        "https://storage.yandexcloud.net/thapl-public/folder/product.JPEG",
      );
    });
  });
});
