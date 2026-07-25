import { createHash } from "node:crypto";
import type { ProductModifierGroup } from "../catalog/product.entity";
import type { CreateOrderModifierDto } from "./create-order.dto";
import type { OrderModifierSnapshot } from "./order-item.entity";

export type PricableProduct = {
  id: number;
  name: string;
  price: number;
  modifierGroups: ProductModifierGroup[];
};

export type PricedOrderLine = {
  productId: number;
  productName: string;
  basePrice: number;
  modifiersPrice: number;
  unitPrice: number;
  lineTotal: number;
  quantity: number;
  configurationKey: string;
  modifierSnapshots: OrderModifierSnapshot[];
};

export class OrderPricingError extends Error {}

function selectionKey(selection: CreateOrderModifierDto) {
  return `${selection.groupId}\u0000${selection.itemId}`;
}

function safeMoney(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new OrderPricingError(`Invalid ${field} in catalog`);
  }
  return value;
}

export function priceOrderLine(
  product: PricableProduct,
  quantity: number,
  requestedSelections: readonly CreateOrderModifierDto[] = [],
): PricedOrderLine {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new OrderPricingError("Quantity must be between 1 and 20");
  }

  const groups = product.modifierGroups ?? [];
  const groupIds = new Set<string>();
  for (const group of groups) {
    if (groupIds.has(group.id)) throw new OrderPricingError(`Duplicate modifier group ${group.id} in catalog`);
    groupIds.add(group.id);
  }

  const requestedKeys = new Set<string>();
  const requestedByGroup = new Map<string, Set<string>>();
  const requestedQuantities = new Map<string, number>();
  let totalModifierQuantity = 0;
  for (const selection of requestedSelections) {
    const key = selectionKey(selection);
    if (requestedKeys.has(key)) {
      throw new OrderPricingError(`Modifier ${selection.itemId} was selected more than once`);
    }
    requestedKeys.add(key);
    const group = groups.find((candidate) => candidate.id === selection.groupId);
    if (!group) throw new OrderPricingError(`Unknown modifier group ${selection.groupId}`);
    const item = group.items.find((candidate) => candidate.id === selection.itemId);
    if (!item) throw new OrderPricingError(`Unknown modifier ${selection.itemId}`);
    if (item.enabled === false) throw new OrderPricingError(`Modifier ${selection.itemId} is unavailable`);
    const modifierQuantity = selection.quantity ?? 1;
    if (!Number.isInteger(modifierQuantity) || modifierQuantity < 1 || modifierQuantity > 20) {
      throw new OrderPricingError(`Modifier quantity for ${selection.itemId} must be between 1 and 20`);
    }
    if (group.selectionType === "single" && modifierQuantity !== 1) {
      throw new OrderPricingError(`Single-choice modifier ${selection.itemId} must have quantity 1`);
    }
    totalModifierQuantity += modifierQuantity;
    if (totalModifierQuantity > 50) {
      throw new OrderPricingError("Total modifier quantity cannot exceed 50");
    }
    requestedQuantities.set(key, modifierQuantity);
    const selectedItems = requestedByGroup.get(group.id) ?? new Set<string>();
    selectedItems.add(item.id);
    requestedByGroup.set(group.id, selectedItems);
  }

  const modifierSnapshots: OrderModifierSnapshot[] = [];
  for (const group of groups) {
    const selectedIds = requestedByGroup.get(group.id) ?? new Set<string>();
    if (group.selectionType !== "single" && group.selectionType !== "multiple") {
      throw new OrderPricingError(`Invalid selection type in ${group.title}`);
    }
    const declaredMinimum = group.minSelections ?? (group.required ? 1 : 0);
    const declaredMaximum = group.selectionType === "single"
      ? (group.maxSelections ?? 1)
      : (group.maxSelections ?? group.items.filter((item) => item.enabled !== false).length);
    if (!Number.isInteger(declaredMinimum) || declaredMinimum < 0) {
      throw new OrderPricingError(`Invalid minimum selections in ${group.title}`);
    }
    if (!Number.isInteger(declaredMaximum) || declaredMaximum < declaredMinimum) {
      throw new OrderPricingError(`Invalid maximum selections in ${group.title}`);
    }
    if (group.selectionType === "single" && declaredMaximum !== 1) {
      throw new OrderPricingError(`Single-choice group ${group.title} must allow exactly one selection`);
    }
    const minimum = Math.max(declaredMinimum, group.required ? 1 : 0);
    const maximum = declaredMaximum;
    if (maximum < minimum) {
      throw new OrderPricingError(`Invalid selection range in ${group.title}`);
    }

    if (selectedIds.size < minimum) {
      throw new OrderPricingError(`Select at least ${minimum} option(s) in ${group.title}`);
    }
    if (selectedIds.size > maximum) {
      throw new OrderPricingError(`Select no more than ${maximum} option(s) in ${group.title}`);
    }

    const itemIds = new Set<string>();
    for (const item of group.items) {
      if (itemIds.has(item.id)) throw new OrderPricingError(`Duplicate modifier ${item.id} in catalog`);
      itemIds.add(item.id);
      if (!selectedIds.has(item.id)) continue;
      const quantity = requestedQuantities.get(`${group.id}\u0000${item.id}`) ?? 1;
      const price = safeMoney(item.price, `modifier price for ${item.id}`);
      const totalPrice = safeMoney(price * quantity, `modifier total for ${item.id}`);
      modifierSnapshots.push({
        groupId: group.id,
        groupTitle: group.title,
        itemId: item.id,
        itemName: item.name,
        price,
        quantity,
        totalPrice,
      });
    }
  }

  const basePrice = safeMoney(product.price, `price for product ${product.id}`);
  const modifiersPrice = safeMoney(
    modifierSnapshots.reduce((sum, snapshot) => sum + snapshot.totalPrice, 0),
    `modifier total for product ${product.id}`,
  );
  const unitPrice = safeMoney(basePrice + modifiersPrice, `unit price for product ${product.id}`);
  const lineTotal = unitPrice * quantity;
  if (!Number.isSafeInteger(lineTotal)) throw new OrderPricingError("Order line total is too large");

  const canonicalConfiguration = modifierSnapshots
    .map((snapshot) => `${snapshot.groupId}:${snapshot.itemId}:${snapshot.quantity}`)
    .sort();
  const configurationKey = createHash("sha256")
    .update(JSON.stringify({ productId: product.id, modifiers: canonicalConfiguration }))
    .digest("hex");

  return {
    productId: product.id,
    productName: product.name,
    basePrice,
    modifiersPrice,
    unitPrice,
    lineTotal,
    quantity,
    configurationKey,
    modifierSnapshots,
  };
}
