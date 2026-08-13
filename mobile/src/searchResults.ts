import type { Category, Product } from "./types";

export function groupSearchResults(
  results: Product[],
  selectedCategorySlug: string | null,
  visibleCategories: Category[],
): Category[] {
  if (selectedCategorySlug) return visibleCategories;
  const products = results.filter((product) => product.available !== false);
  return products.length ? [{
    id: -1,
    slug: "search-results",
    title: "",
    products,
  }] : [];
}
