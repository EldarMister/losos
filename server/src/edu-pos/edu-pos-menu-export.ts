import type { ProductModifierGroup } from "../catalog/product.entity";
import type { EduPosMenuExportPayload } from "./edu-pos.types";

export type MenuExportCategoryInput = {
  id: number;
  slug: string;
  title: string;
  image: string;
  sortOrder: number;
  products: Array<{
    id: number;
    sourceId: number | null;
    slug: string;
    name: string;
    description: string;
    composition: string;
    image: string;
    price: number;
    oldPrice: number | null;
    available: boolean;
    posAvailable: boolean;
    posDishId: string | null;
    posSoldByWeight: boolean;
    weight: number;
    sortOrder: number;
    modifierGroups: ProductModifierGroup[];
  }>;
};

export function normalizeEduPosWeightGrams(weight: number): number | null {
  if (!Number.isFinite(weight) || weight < 1) return null;
  return Math.round(weight);
}

export function buildEduPosMenuExportPayload(
  regionSlug: string,
  menuSourceRegionSlug: string,
  categories: MenuExportCategoryInput[],
  exportedAt = new Date(),
): EduPosMenuExportPayload {
  return {
    source: "nakta-sushi",
    regionSlug,
    menuSourceRegionSlug,
    exportedAt: exportedAt.toISOString(),
    categories: categories.map((category) => ({
      id: `nakta-category-${category.id}`,
      sourceId: category.id,
      slug: category.slug,
      name: category.title,
      imageUrl: category.image,
      sortOrder: category.sortOrder,
      products: category.products.map((product) => ({
        id: product.posDishId || `nakta-product-${product.id}`,
        sourceId: product.sourceId ?? product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        composition: product.composition,
        imageUrl: product.image,
        price: product.price,
        originalPrice: product.oldPrice,
        available: product.available && product.posAvailable,
        soldByWeight: product.posSoldByWeight,
        weightGrams: normalizeEduPosWeightGrams(product.weight),
        sortOrder: product.sortOrder,
        modifiers: product.modifierGroups.map((group) => ({
          id: group.id,
          name: group.title,
          selectionType: group.selectionType,
          required: group.required,
          minSelections: group.minSelections ?? (group.required ? 1 : 0),
          maxSelections: group.maxSelections ?? (group.selectionType === "single" ? 1 : null),
          priceScope: group.priceScope ?? "per-product",
          items: group.items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            available: item.enabled !== false,
            maxQuantity: item.maxQuantity ?? null,
          })),
        })),
      })),
    })),
  };
}
