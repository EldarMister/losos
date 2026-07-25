import type {
  ModifierPriceScope,
  ProductModifierGroup,
  ProductModifierItem,
} from "./product.entity";
import { POSTGRES_INTEGER_MAX } from "../common/numeric-limits";

export const MAX_MODIFIER_ITEM_QUANTITY = 99;
export const LEGACY_MULTIPLE_ITEM_MAX_QUANTITY = 20;
export const MAX_TOTAL_MODIFIER_QUANTITY = 500;

export class ModifierCatalogValidationError extends Error {}

export function resolveModifierPriceScope(
  group: Pick<ProductModifierGroup, "priceScope">,
): ModifierPriceScope {
  return group.priceScope ?? "per-product";
}

export function resolveModifierItemMaxQuantity(
  group: Pick<ProductModifierGroup, "selectionType">,
  item: Pick<ProductModifierItem, "maxQuantity">,
) {
  return item.maxQuantity
    ?? (group.selectionType === "single" ? 1 : LEGACY_MULTIPLE_ITEM_MAX_QUANTITY);
}

export function resolveModifierSelectionBounds(group: ProductModifierGroup) {
  const enabledItemCount = group.items.filter((item) => item.enabled !== false).length;
  const minimum = Math.max(
    group.minSelections ?? (group.required ? 1 : 0),
    group.required ? 1 : 0,
  );
  const maximum = group.selectionType === "single"
    ? (group.maxSelections ?? 1)
    : (group.maxSelections ?? enabledItemCount);
  return { enabledItemCount, minimum, maximum };
}

function fail(message: string): never {
  throw new ModifierCatalogValidationError(message);
}

export function assertValidModifierGroups(
  groups: readonly ProductModifierGroup[],
): void {
  const groupIds = new Set<string>();
  let minimumModifierQuantity = 0;

  for (const group of groups) {
    if (groupIds.has(group.id)) fail(`Duplicate modifier group ${group.id} in catalog`);
    groupIds.add(group.id);

    if (group.selectionType !== "single" && group.selectionType !== "multiple") {
      fail(`Invalid selection type in ${group.title}`);
    }
    const priceScope = resolveModifierPriceScope(group);
    if (priceScope !== "per-product" && priceScope !== "per-line") {
      fail(`Invalid price scope in ${group.title}`);
    }
    if (!Array.isArray(group.items)) fail(`Invalid options in ${group.title}`);

    const { enabledItemCount, minimum, maximum } = resolveModifierSelectionBounds(group);
    if (!Number.isInteger(minimum) || minimum < 0 || minimum > 99) {
      fail(`Invalid minimum selections in ${group.title}`);
    }
    if (!Number.isInteger(maximum) || maximum < minimum || maximum > 99) {
      fail(`Invalid maximum selections in ${group.title}`);
    }
    if (group.selectionType === "single" && maximum !== 1) {
      fail(`Single-choice group ${group.title} must allow exactly one selection`);
    }
    if (minimum > enabledItemCount) {
      fail(`${group.title} requires more enabled options than it has`);
    }
    minimumModifierQuantity += minimum;
    if (minimumModifierQuantity > MAX_TOTAL_MODIFIER_QUANTITY) {
      fail(
        `Required modifier quantity cannot exceed ${MAX_TOTAL_MODIFIER_QUANTITY}`,
      );
    }

    const itemIds = new Set<string>();
    for (const item of group.items) {
      if (itemIds.has(item.id)) fail(`Duplicate modifier ${item.id} in catalog`);
      itemIds.add(item.id);
      if (
        !Number.isSafeInteger(item.price)
        || item.price < 0
        || item.price > POSTGRES_INTEGER_MAX
      ) {
        fail(`Invalid modifier price for ${item.id}`);
      }

      const maximumQuantity = resolveModifierItemMaxQuantity(group, item);
      if (
        !Number.isInteger(maximumQuantity)
        || maximumQuantity < 1
        || maximumQuantity > MAX_MODIFIER_ITEM_QUANTITY
      ) {
        fail(`Invalid maximum quantity for ${item.id}`);
      }
      if (group.selectionType === "single" && maximumQuantity !== 1) {
        fail(`Single-choice modifier ${item.id} must have maximum quantity 1`);
      }
    }
  }
}
