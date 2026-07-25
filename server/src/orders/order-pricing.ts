import { createHash } from "node:crypto";
import {
  assertValidModifierGroups,
  MAX_MODIFIER_ITEM_QUANTITY,
  MAX_TOTAL_MODIFIER_QUANTITY,
  ModifierCatalogValidationError,
  resolveModifierItemMaxQuantity,
  resolveModifierPriceScope,
  resolveModifierSelectionBounds,
} from "../catalog/modifier-validation";
import type { ProductModifierGroup } from "../catalog/product.entity";
import { POSTGRES_INTEGER_MAX } from "../common/numeric-limits";
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
  baseTotal: number;
  modifiersPrice: number;
  modifiersTotal: number;
  unitPrice: number;
  lineTotal: number;
  pricingVersion: "scoped-v2";
  quantity: number;
  configurationKey: string;
  modifierSnapshots: OrderModifierSnapshot[];
};

export class OrderPricingError extends Error {}

function selectionKey(selection: CreateOrderModifierDto) {
  return `${selection.groupId}\u0000${selection.itemId}`;
}

function safeMoney(value: number, field: string) {
  if (
    !Number.isSafeInteger(value)
    || value < 0
    || value > POSTGRES_INTEGER_MAX
  ) {
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
  try {
    assertValidModifierGroups(groups);
  } catch (error) {
    if (error instanceof ModifierCatalogValidationError) {
      throw new OrderPricingError(error.message);
    }
    throw error;
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
    const maximumQuantity = resolveModifierItemMaxQuantity(group, item);
    if (
      !Number.isInteger(modifierQuantity)
      || modifierQuantity < 1
      || modifierQuantity > MAX_MODIFIER_ITEM_QUANTITY
    ) {
      throw new OrderPricingError(
        `Modifier quantity for ${selection.itemId} must be between 1 and ${MAX_MODIFIER_ITEM_QUANTITY}`,
      );
    }
    if (modifierQuantity > maximumQuantity) {
      throw new OrderPricingError(
        `Modifier quantity for ${selection.itemId} cannot exceed ${maximumQuantity}`,
      );
    }
    totalModifierQuantity += modifierQuantity;
    if (totalModifierQuantity > MAX_TOTAL_MODIFIER_QUANTITY) {
      throw new OrderPricingError(
        `Total modifier quantity cannot exceed ${MAX_TOTAL_MODIFIER_QUANTITY}`,
      );
    }
    requestedQuantities.set(key, modifierQuantity);
    const selectedItems = requestedByGroup.get(group.id) ?? new Set<string>();
    selectedItems.add(item.id);
    requestedByGroup.set(group.id, selectedItems);
  }

  const modifierSnapshots: OrderModifierSnapshot[] = [];
  for (const group of groups) {
    const selectedIds = requestedByGroup.get(group.id) ?? new Set<string>();
    const { minimum, maximum } = resolveModifierSelectionBounds(group);

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
        priceScope: resolveModifierPriceScope(group),
      });
    }
  }

  const basePrice = safeMoney(product.price, `price for product ${product.id}`);
  const baseTotal = safeMoney(
    basePrice * quantity,
    `base total for product ${product.id}`,
  );
  const modifiersPrice = safeMoney(
    modifierSnapshots.reduce((sum, snapshot) => sum + snapshot.totalPrice, 0),
    `modifier total for product ${product.id}`,
  );
  const perProductModifiersPrice = safeMoney(
    modifierSnapshots
      .filter((snapshot) => snapshot.priceScope === "per-product")
      .reduce((sum, snapshot) => sum + snapshot.totalPrice, 0),
    `per-product modifier total for product ${product.id}`,
  );
  const perLineModifiersPrice = safeMoney(
    modifierSnapshots
      .filter((snapshot) => snapshot.priceScope === "per-line")
      .reduce((sum, snapshot) => sum + snapshot.totalPrice, 0),
    `per-line modifier total for product ${product.id}`,
  );
  const modifiersTotal = safeMoney(
    perProductModifiersPrice * quantity + perLineModifiersPrice,
    `modifier line total for product ${product.id}`,
  );
  const unitPrice = safeMoney(
    basePrice + perProductModifiersPrice,
    `unit price for product ${product.id}`,
  );
  const lineTotal = safeMoney(
    baseTotal + modifiersTotal,
    `order line total for product ${product.id}`,
  );

  const canonicalConfiguration = modifierSnapshots
    .map((snapshot) =>
      `${snapshot.groupId}:${snapshot.itemId}:${snapshot.quantity}:${snapshot.priceScope}`)
    .sort();
  const configurationKey = createHash("sha256")
    .update(JSON.stringify({ productId: product.id, modifiers: canonicalConfiguration }))
    .digest("hex");

  return {
    productId: product.id,
    productName: product.name,
    basePrice,
    baseTotal,
    modifiersPrice,
    modifiersTotal,
    unitPrice,
    lineTotal,
    pricingVersion: "scoped-v2",
    quantity,
    configurationKey,
    modifierSnapshots,
  };
}
