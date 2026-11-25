import { Body, Controller, Get, Header, Module, Patch, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { AdminSecurityModule } from "../admin/admin-security.module";
import { AdminTokenGuard } from "../admin/admin-token.guard";
import { RequirePermissions } from "../admin/admin-permissions";
import { AdminAuditInterceptor } from "../admin/admin-audit.interceptor";
import { UpdateSiteContactsDto } from "./site-settings.dto";
import { SiteSettingsService } from "./site-settings.service";

@Controller()
export class SiteSettingsController {
  constructor(private readonly settings: SiteSettingsService) {}
  @Get("site-settings") @Header("Cache-Control", "no-store")
  publicContacts(@Query("region") region?: string) { return this.settings.publicContacts(region); }
  @Get("admin/site-settings") @UseGuards(AdminTokenGuard) @RequirePermissions("settings.view") @Header("Cache-Control", "no-store")
  read() { return this.settings.settings(); }
  @Patch("admin/site-settings") @UseGuards(AdminTokenGuard) @RequirePermissions("settings.edit") @UseInterceptors(AdminAuditInterceptor)
  update(@Body() dto: UpdateSiteContactsDto) { return this.settings.update(dto); }
}
@Module({ imports: [AdminSecurityModule], controllers: [SiteSettingsController], providers: [SiteSettingsService] })
export class SiteSettingsModule {}
