export type ProductKitItem = {
  id: string;
  quantity: number;
};

export type ProductKitCatalogItem = {
  id: string;
  name: string;
  image: string;
  enabled?: boolean;
};

export type IncludedKitItem = ProductKitItem & {
  name: string;
  image: string;
};

export const MAX_ORDER_KIT_QUANTITY = 40_000;

export class ProductKitValidationError extends Error {}

export function assertValidProductKitItems(
  items: ProductKitItem[] | undefined,
  catalog: ProductKitCatalogItem[],
): void {
  if (items === undefined) return;
  if (!Array.isArray(items) || items.length > 20) {
    throw new ProductKitValidationError("В комплектации блюда может быть до 20 позиций");
  }
  const enabledIds = new Set(catalog.filter((item) => item.enabled !== false).map((item) => item.id));
  const usedIds = new Set<string>();
  for (const item of items) {
    if (!item || !enabledIds.has(item.id)) {
      throw new ProductKitValidationError(`Неизвестная комплектующая: ${item?.id ?? ""}`);
    }
    if (usedIds.has(item.id)) {
      throw new ProductKitValidationError(`Комплектующая ${item.id} указана несколько раз`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      throw new ProductKitValidationError("Количество комплектующей на блюдо должно быть от 1 до 20");
    }
    usedIds.add(item.id);
  }
}

export function aggregateProductKitItems(
  lines: Array<{ quantity: number; kitItems?: ProductKitItem[] | null }>,
  catalog: ProductKitCatalogItem[],
): IncludedKitItem[] {
  const enabledCatalog = catalog.filter((item) => item.enabled !== false);
  const enabledIds = new Set(enabledCatalog.map((item) => item.id));
  const quantities = new Map<string, number>();
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) continue;
    for (const item of line.kitItems ?? []) {
      if (!enabledIds.has(item.id) || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 20) continue;
      const quantity = (quantities.get(item.id) ?? 0) + item.quantity * line.quantity;
      if (!Number.isSafeInteger(quantity) || quantity > MAX_ORDER_KIT_QUANTITY) {
        throw new ProductKitValidationError("Слишком большое количество комплектующих в заказе");
      }
      quantities.set(item.id, quantity);
    }
  }
  return enabledCatalog.flatMap((item) => {
    const quantity = quantities.get(item.id) ?? 0;
    return quantity > 0 ? [{ id: item.id, name: item.name, image: item.image || "", quantity }] : [];
  });
}
