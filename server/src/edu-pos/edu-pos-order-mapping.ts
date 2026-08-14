import { normalizeEduPosWeightGrams } from "./edu-pos-menu-export";

type OrderItemMappingTarget = {
  productId: number;
  posDishId: string | null;
  posVariantId: string | null;
  posWeightGrams: number | null;
};

type ProductMappingSource = {
  id: number;
  posDishId: string | null;
  posVariantId: string | null;
  posSoldByWeight: boolean;
  weight: number;
};

export function backfillOrderItemMappings<T extends OrderItemMappingTarget>(
  items: T[],
  products: ProductMappingSource[],
): T[] {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const updated: T[] = [];

  for (const item of items) {
    if (item.posDishId) continue;
    const product = productsById.get(item.productId);
    if (!product?.posDishId) continue;
    item.posDishId = product.posDishId;
    item.posVariantId = product.posVariantId;
    item.posWeightGrams = product.posSoldByWeight
      ? normalizeEduPosWeightGrams(product.weight)
      : null;
    updated.push(item);
  }

  return updated;
}
