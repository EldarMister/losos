import type { Category, Product, Region } from "./types";

export type FreeKitItem = {
  id: string;
  name: string;
  image: string;
  defaultQuantity: number;
  enabled?: boolean;
};

export const fallbackFreeKitItems: FreeKitItem[] = [
  { id: "soy-sauce", name: "Соус соевый", image: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/8a6ed9632df66e2010fc4a1eccef758c_thumb_75_1152_1152.JPEG", defaultQuantity: 2, enabled: true },
  { id: "wasabi", name: "Васаби", image: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/aa8eef7dfdda0436a337ddb4c0970125_thumb_75_1152_1152.JPEG", defaultQuantity: 1, enabled: true },
  { id: "pickled-ginger", name: "Имбирь", image: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/a71852e053134d8a7863bc1ce6a13ece_thumb_75_1152_1152.JPEG", defaultQuantity: 1, enabled: true },
];

export function freeKitItemsForRegion(region?: Region | null) {
  return (region?.freeKitItems ?? fallbackFreeKitItems)
    .filter((item) => item.enabled !== false)
    .map((item) => ({ ...item, image: item.image || "" }));
}

export function toppingProductsForRegion(
  region: Region | null | undefined,
  categories: Category[],
): Product[] {
  const allProducts = categories.flatMap((category) => category.products);
  if (region?.toppingProductIds != null) {
    const productsById = new Map(allProducts.map((product) => [product.id, product]));
    return region.toppingProductIds
      .map((id) => productsById.get(id))
      .filter((product): product is Product => product !== undefined && product.available !== false);
  }
  return categories
    .filter((category) => /топпинг|соус|добав|васаби|имбир/i.test(`${category.slug} ${category.title}`))
    .flatMap((category) => category.products)
    .filter((product) => product.available !== false);
}
