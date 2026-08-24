import { freeKitItemsForRegion, toppingProductsForRegion } from "../cartConfiguration";
import type { Category, Region } from "../types";

const categories: Category[] = [
  {
    id: 1,
    slug: "rolls",
    title: "Роллы",
    products: [{ id: 10, slug: "roll", name: "Ролл", price: 300, image: "", description: "" }],
  },
  {
    id: 2,
    slug: "sauces",
    title: "Соусы",
    products: [
      { id: 20, slug: "spicy", name: "Соус спайси", price: 60, image: "", description: "" },
      { id: 21, slug: "cheese", name: "Соус сырный", price: 70, image: "", description: "", available: false },
    ],
  },
];

test("explicit regional cart configuration overrides legacy defaults", () => {
  const region = {
    id: 1,
    slug: "bishkek",
    name: "Бишкек",
    freeKitItems: [{ id: "napkins", name: "Салфетки", image: "napkins.jpg", defaultQuantity: 3 }],
    toppingProductIds: [10, 21],
  } satisfies Region;

  expect(freeKitItemsForRegion(region)).toEqual([
    { id: "napkins", name: "Салфетки", image: "napkins.jpg", defaultQuantity: 3 },
  ]);
  expect(toppingProductsForRegion(region, categories).map((product) => product.id)).toEqual([10]);
});

test("explicit empty lists disable free kit and toppings", () => {
  const region = {
    id: 1,
    slug: "osh",
    name: "Ош",
    freeKitItems: [],
    toppingProductIds: [],
  } satisfies Region;

  expect(freeKitItemsForRegion(region)).toEqual([]);
  expect(toppingProductsForRegion(region, categories)).toEqual([]);
});

test("legacy regions still discover toppings from the catalog", () => {
  expect(toppingProductsForRegion(undefined, categories).map((product) => product.id)).toEqual([20]);
  expect(freeKitItemsForRegion(undefined)).toHaveLength(3);
});
