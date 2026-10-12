import { BadRequestException, ForbiddenException, SetMetadata } from "@nestjs/common";

export const STAFF_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;
export type StaffRole = typeof STAFF_ROLES[number];
export type PermissionOverride = "allow" | "deny" | "inherit";
export type PermissionOverrides = Record<string, PermissionOverride>;
const actionLabels: Record<string, string> = { view: "Просмотр", create: "Создание", edit: "Редактирование", delete: "Удаление / архивация", export: "Экспорт", status: "Смена статуса" };
const section = (key: string, label: string, actions: string[]) => ({ section: key, label, permissions: actions.map(action => ({ key: `${key}.${action}`, label: actionLabels[action] })) });
export const PERMISSION_CATALOG = [
  section("dashboard", "Обзор", ["view"]),
  section("orders", "Заказы", ["view", "edit", "status"]),
  section("products", "Товары", ["view", "create", "edit", "delete"]),
  section("categories", "Категории", ["view", "create", "edit", "delete"]),
  section("modifiers", "Модификаторы", ["view", "edit"]),
  section("kits", "Комплектации", ["view", "edit"]),
  section("promotions", "Акции", ["view", "create", "edit", "delete"]),
  section("cities", "Города и точки выдачи", ["view", "create", "edit", "delete"]),
  section("hours", "Время работы", ["view", "edit"]),
  section("customers", "Клиенты", ["view", "edit"]),
  section("analytics", "Аналитика", ["view", "export"]),
  section("settings", "Настройки", ["view", "edit"]),
  section("integrations", "Интеграции", ["view", "edit", "export"]),
  section("staff", "Персонал", ["view", "create", "edit"]),
  section("audit", "Журнал действий", ["view"]),
];
export const ALL_PERMISSIONS = PERMISSION_CATALOG.flatMap(group => group.permissions.map(item => item.key));
const managerDefaults = new Set(["orders.view", "orders.edit", "orders.status", "customers.view", "customers.edit"]);
export type StaffAccess = { role: StaffRole; active: boolean; permissions: PermissionOverrides };
export type StaffIdentity = StaffAccess & { id: string; login: string; name: string; effectivePermissions: string[]; sessionId?: string; createdAt?: string; updatedAt?: string };
export function effectivePermissions(staff: StaffAccess): string[] {
  if (!staff.active) return [];
  if (staff.role === "OWNER") return [...ALL_PERMISSIONS];
  const granted = ALL_PERMISSIONS.filter(key => {
    const override = staff.permissions?.[key];
    if (override === "deny") return false;
    if (override === "allow") return true;
    return staff.role === "ADMIN" || managerDefaults.has(key);
  });
  return granted.filter(key => key !== "staff.create" && (key.endsWith(".view") || granted.includes(`${key.split(".")[0]}.view`)));
}
export const hasPermission = (staff: StaffAccess, key: string) => effectivePermissions(staff).includes(key);
export function assertPermission(staff: StaffAccess, key: string) {
  if (!hasPermission(staff, key)) throw new ForbiddenException("Недостаточно прав для этого действия");
}
export function validateOverrides(input: unknown): PermissionOverrides {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new BadRequestException("Некорректная матрица доступа");
  const result: PermissionOverrides = {};
  for (const [key, value] of Object.entries(input)) {
    if (!ALL_PERMISSIONS.includes(key) || !["allow", "deny", "inherit"].includes(String(value))) throw new BadRequestException("Неизвестное разрешение или значение");
    if (value !== "inherit") result[key] = value as PermissionOverride;
  }
  return result;
}
export const ADMIN_ACCESS = "admin:access";
export type AccessRequirement = { permissions?: string[]; any?: string[]; ownerOnly?: boolean };
export const RequirePermissions = (...permissions: string[]) => SetMetadata(ADMIN_ACCESS, { permissions } satisfies AccessRequirement);
export const RequirePermission = RequirePermissions;
export const AnyPermission = (...any: string[]) => SetMetadata(ADMIN_ACCESS, { any } satisfies AccessRequirement);
export const AllowStaff = () => RequirePermissions();
export const OwnerOnly = () => SetMetadata(ADMIN_ACCESS, { ownerOnly: true } satisfies AccessRequirement);

export const REGION_HOURS_FIELDS = new Set(["deliveryOpenTime", "deliveryCloseTime", "deliveryIs24Hours", "deliveryWorkingDays", "pickupWorkingHours"]);
export const REGION_CITY_FIELDS = new Set(["slug", "name", "enabled", "sortOrder", "contactPhone", "contactEmail", "contactAddress", "supportPhone", "supportUrl", "pickupAddress", "pickupYandexUrl"]);
export function assertRegionFields(staff: StaffAccess, body: Record<string, unknown>, creating = false) {
  for (const field of Object.keys(body)) {
    const permission = ["freeKitItems", "toppingProductIds"].includes(field) ? "kits.edit" : REGION_HOURS_FIELDS.has(field) ? "hours.edit" : REGION_CITY_FIELDS.has(field) ? creating ? "cities.create" : "cities.edit" : "settings.edit";
    assertPermission(staff, permission);
  }
}
export function assertProductFields(staff: StaffAccess, body: Record<string, unknown>, creating = false) {
  if (creating) assertPermission(staff, "products.create");
  for (const field of Object.keys(body)) {
    if (field === "modifierGroups") assertPermission(staff, "modifiers.edit");
    else if (field === "kitItems") assertPermission(staff, "kits.edit");
    else if (!creating) assertPermission(staff, "products.edit");
  }
}
