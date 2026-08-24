import { BadRequestException } from "@nestjs/common";
import { DEFAULT_FREE_KIT_ITEMS, type FreeKitItemConfig } from "../catalog/cart-configuration";

export type OrderKitItem = {
  id: string;
  name: string;
  quantity: number;
};

export type OrderKitSelection = {
  id: string;
  quantity: number;
};

export function normalizeOrderKitItems(
  selections?: OrderKitSelection[] | null,
  catalog: FreeKitItemConfig[] = DEFAULT_FREE_KIT_ITEMS,
): OrderKitItem[] {
  const byId = new Map<string, number>();
  for (const selection of selections ?? []) {
    if (byId.has(selection.id)) {
      throw new BadRequestException(`Комплектующая ${selection.id} указана несколько раз`);
    }
    byId.set(selection.id, selection.quantity);
  }

  const enabledCatalog = catalog.filter((item) => item.enabled !== false);
  const knownIds = new Set<string>(enabledCatalog.map((item) => item.id));
  const unknown = [...byId.keys()].find((id) => !knownIds.has(id));
  if (unknown) throw new BadRequestException(`Неизвестная комплектующая: ${unknown}`);

  return enabledCatalog.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: byId.get(item.id) ?? item.defaultQuantity,
  }));
}
