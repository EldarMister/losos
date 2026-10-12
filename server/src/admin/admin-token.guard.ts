import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ADMIN_ACCESS, assertPermission, hasPermission, type AccessRequirement, type StaffIdentity } from "./admin-permissions";
import { AdminSecurityService } from "./admin-security.service";

export type AdminRequest = {
  headers: Record<string, string | string[] | undefined>;
  staff: StaffIdentity; admin: StaffIdentity; adminToken: string;
  body?: Record<string, unknown>; method?: string; path?: string; params?: Record<string, string>;
};
export function bearerToken(request: Pick<AdminRequest, "headers">) {
  const header = request.headers.authorization;
  return typeof header === "string" && /^Bearer /i.test(header) ? header.slice(7).trim() : "";
}

@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(private readonly security: AdminSecurityService, private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    context.switchToHttp().getResponse<{ setHeader?: (key: string, value: string) => void }>().setHeader?.("Cache-Control", "no-store");
    const token = bearerToken(request);
    const staff = await this.security.authenticate(token);
    const requirement = this.reflector.getAllAndOverride<AccessRequirement>(ADMIN_ACCESS, [context.getHandler(), context.getClass()]);
    if (!requirement) throw new ForbiddenException("Для этого действия не настроены права доступа");
    if (requirement.ownerOnly && staff.role !== "OWNER") throw new ForbiddenException("Только владелец может менять роли и права доступа");
    for (const key of requirement.permissions || []) assertPermission(staff, key);
    if (requirement.any && !requirement.any.some(key => hasPermission(staff, key))) throw new ForbiddenException("Нет доступа к разделу");
    if (context.getHandler().name === "updateStaff" && request.body && Object.keys(request.body).some(key => !["name", "active", "password"].includes(key))) {
      throw new ForbiddenException("Роль и права изменяются только владельцем через отдельное действие");
    }
    request.staff = request.admin = staff;
    request.adminToken = token;
    return true;
  }
}
