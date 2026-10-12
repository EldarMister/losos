import { Global, Module } from "@nestjs/common";
import { AdminSecurityService } from "./admin-security.service";
import { AdminTokenGuard } from "./admin-token.guard";
import { AdminAuthController, AdminStaffController } from "./admin-security.controller";
import { AdminAuditInterceptor } from "./admin-audit.interceptor";

@Global()
@Module({
  controllers: [AdminAuthController, AdminStaffController],
  providers: [AdminSecurityService, AdminTokenGuard, AdminAuditInterceptor],
  exports: [AdminSecurityService, AdminTokenGuard, AdminAuditInterceptor],
})
export class AdminSecurityModule {}
