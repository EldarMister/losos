export type ProductKitItem = { id: string; quantity: number };
export type KitCatalogItem = { id: string; name: string; image?: string; enabled?: boolean };
export type IncludedKitItem = { id: string; name: string; image: string; quantity: number };

export function aggregateProductKitItems(
  lines: Array<{ quantity: number; kitItems?: ProductKitItem[] | null }>,
  catalog: readonly KitCatalogItem[],
): IncludedKitItem[] {
  const quantities = new Map<string, number>();
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) continue;
    for (const item of line.kitItems ?? []) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 20) continue;
      quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity * line.quantity);
    }
  }
  return catalog.flatMap((item) => {
    const quantity = quantities.get(item.id) ?? 0;
    return item.enabled !== false && quantity > 0
      ? [{ id: item.id, name: item.name, image: item.image || "", quantity }]
      : [];
  });
}

export function selectedKitQuantity(includedQuantity: number, adjustment = 0): number {
  return Math.max(0, Math.min(includedQuantity, includedQuantity + adjustment));
}
