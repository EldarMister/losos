export type FreeKitItemConfig = {
  id: string;
  name: string;
  image: string;
  defaultQuantity: number;
  enabled?: boolean;
};

export const DEFAULT_FREE_KIT_ITEMS: FreeKitItemConfig[] = [
  {
    id: "soy-sauce",
    name: "Соус соевый",
    image: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/8a6ed9632df66e2010fc4a1eccef758c_thumb_75_1152_1152.JPEG",
    defaultQuantity: 2,
    enabled: true,
  },
  {
    id: "wasabi",
    name: "Васаби",
    image: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/aa8eef7dfdda0436a337ddb4c0970125_thumb_75_1152_1152.JPEG",
    defaultQuantity: 1,
    enabled: true,
  },
  {
    id: "pickled-ginger",
    name: "Имбирь",
    image: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/a71852e053134d8a7863bc1ce6a13ece_thumb_75_1152_1152.JPEG",
    defaultQuantity: 1,
    enabled: true,
  },
];

export function freeKitItemsForRegion(
  items?: FreeKitItemConfig[] | null,
): FreeKitItemConfig[] {
  const source = items === null || items === undefined ? DEFAULT_FREE_KIT_ITEMS : items;
  return source
    .filter((item) => item.enabled !== false)
    .map((item) => ({
      id: item.id,
      name: item.name,
      image: item.image || "",
      defaultQuantity: item.defaultQuantity,
      enabled: true,
    }));
}
