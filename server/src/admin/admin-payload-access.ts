import { hasPermission, REGION_CITY_FIELDS, REGION_HOURS_FIELDS, type StaffAccess } from "./admin-permissions";

export function filterAdminProduct(product: Record<string, unknown>, staff: StaffAccess) {
  return {
    ...product,
    category: undefined,
    modifierGroups: hasPermission(staff, "modifiers.view") ? product.modifierGroups : [],
    kitItems: hasPermission(staff, "kits.view") ? product.kitItems : [],
  };
}

export function filterAdminRegion(region: Record<string, unknown>, staff: StaffAccess): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(region)) {
    if (["id", "slug", "name", "enabled", "sortOrder"].includes(key)) result[key] = value;
    else if (REGION_HOURS_FIELDS.has(key) && hasPermission(staff, "hours.view")) result[key] = value;
    else if ((REGION_CITY_FIELDS.has(key) || key === "pickupLocations") && hasPermission(staff, "cities.view")) result[key] = value;
    else if (["freeKitItems", "toppingProductIds"].includes(key) && hasPermission(staff, "kits.view")) result[key] = value;
    else if (!REGION_HOURS_FIELDS.has(key) && !REGION_CITY_FIELDS.has(key) && !["freeKitItems", "toppingProductIds", "pickupLocations"].includes(key) && hasPermission(staff, "settings.view")) result[key] = value;
  }
  return result;
}

export function filterAdminDashboard<T extends { region: Record<string, unknown>; categories: Array<{ products: Record<string, unknown>[] }>; promotions: unknown[]; kitCatalog: unknown[] }>(data: T, staff: StaffAccess) {
  const productsVisible = ["products.view", "modifiers.view", "kits.view"].some(key => hasPermission(staff, key));
  const categoriesVisible = productsVisible || hasPermission(staff, "categories.view");
  return {
    ...data,
    region: filterAdminRegion(data.region, staff),
    categories: categoriesVisible ? data.categories.map(category => ({ ...category, products: productsVisible ? category.products.map(product => filterAdminProduct(product, staff)) : [] })) : [],
    promotions: hasPermission(staff, "promotions.view") ? data.promotions : [],
    kitCatalog: hasPermission(staff, "kits.view") ? data.kitCatalog : [],
  };
}
