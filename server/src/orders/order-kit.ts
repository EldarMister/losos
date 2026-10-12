import { BadRequestException } from "@nestjs/common";
import { MAX_ORDER_KIT_QUANTITY } from "../catalog/product-kit";

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
  includedItems: OrderKitItem[] = [],
): OrderKitItem[] {
  const byId = new Map<string, number>();
  for (const selection of selections ?? []) {
    if (byId.has(selection.id)) {
      throw new BadRequestException(`Комплектующая ${selection.id} указана несколько раз`);
    }
    if (!Number.isInteger(selection.quantity) || selection.quantity < 0 || selection.quantity > MAX_ORDER_KIT_QUANTITY) {
      throw new BadRequestException("Некорректное количество комплектующей");
    }
    byId.set(selection.id, selection.quantity);
  }

  const knownIds = new Set<string>(includedItems.map((item) => item.id));
  const unknown = [...byId.keys()].find((id) => !knownIds.has(id));
  if (unknown) throw new BadRequestException(`Неизвестная комплектующая: ${unknown}`);

  return includedItems.map((item) => {
    const quantity = byId.get(item.id) ?? item.quantity;
    if (quantity > item.quantity) {
      throw new BadRequestException(`Количество ${item.name} превышает комплектацию выбранных блюд`);
    }
    return { id: item.id, name: item.name, quantity };
  });
}
