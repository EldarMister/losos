import { BadRequestException } from "@nestjs/common";

export const ORDER_KIT_CATALOG = [
  { id: "soy-sauce", name: "Соевый соус" },
  { id: "wasabi", name: "Васаби" },
  { id: "pickled-ginger", name: "Имбирь маринованный" },
] as const;

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
): OrderKitItem[] {
  const byId = new Map<string, number>();
  for (const selection of selections ?? []) {
    if (byId.has(selection.id)) {
      throw new BadRequestException(`Комплектующая ${selection.id} указана несколько раз`);
    }
    byId.set(selection.id, selection.quantity);
  }

  const knownIds = new Set<string>(ORDER_KIT_CATALOG.map((item) => item.id));
  const unknown = [...byId.keys()].find((id) => !knownIds.has(id));
  if (unknown) throw new BadRequestException(`Неизвестная комплектующая: ${unknown}`);

  return ORDER_KIT_CATALOG.map((item) => ({
    ...item,
    quantity: byId.get(item.id) ?? 1,
  }));
}
