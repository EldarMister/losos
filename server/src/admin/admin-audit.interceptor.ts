import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { mergeMap, Observable } from "rxjs";
import type { AdminRequest } from "./admin-token.guard";
import { AdminSecurityService } from "./admin-security.service";

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  constructor(private readonly security: AdminSecurityService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    if (!request.staff || !["POST", "PATCH", "DELETE"].includes(request.method || "")) return next.handle();
    return next.handle().pipe(mergeMap(async result => {
      const fields = Object.keys(request.body || {}).filter(key => !/password|token|secret|key/i.test(key));
      await this.security.audit(request.staff, context.getHandler().name, request.params?.id || request.path || "", { fields });
      return result;
    }));
  }
}
