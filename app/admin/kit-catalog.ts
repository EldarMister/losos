import type { FreeKitItem } from "./admin-types";

// Catalog metadata for regions that do not have an explicit catalog yet.
// Products include these items only after their own kit quantities are configured.
export const fallbackFreeKitItems: FreeKitItem[] = [
  { id: "soy-sauce", name: "Соус соевый", image: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/8a6ed9632df66e2010fc4a1eccef758c_thumb_75_1152_1152.JPEG", defaultQuantity: 2, enabled: true },
  { id: "wasabi", name: "Васаби", image: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/aa8eef7dfdda0436a337ddb4c0970125_thumb_75_1152_1152.JPEG", defaultQuantity: 1, enabled: true },
  { id: "pickled-ginger", name: "Имбирь", image: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/a71852e053134d8a7863bc1ce6a13ece_thumb_75_1152_1152.JPEG", defaultQuantity: 1, enabled: true },
];
