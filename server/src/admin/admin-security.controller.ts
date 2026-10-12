import { Body, Controller, Get, Header, HttpCode, Ip, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AdminSecurityService } from "./admin-security.service";
import { AdminTokenGuard, type AdminRequest } from "./admin-token.guard";
import { AllowStaff, OwnerOnly, PERMISSION_CATALOG, RequirePermissions } from "./admin-permissions";
import { CreateStaffDto, StaffBootstrapDto, StaffLoginDto, UpdateOwnPasswordDto, UpdateStaffAccessDto, UpdateStaffDto } from "./admin-security.dto";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly security: AdminSecurityService) {}
  @Post("login") @HttpCode(200) @Header("Cache-Control", "no-store")
  login(@Body() dto: StaffLoginDto, @Ip() ip: string) { return this.security.login(dto, ip); }
  @Post("bootstrap") @Header("Cache-Control", "no-store")
  bootstrap(@Body() dto: StaffBootstrapDto, @Ip() ip: string) { return this.security.bootstrap(dto, ip); }
  @Get("me") @UseGuards(AdminTokenGuard) @AllowStaff()
  me(@Req() request: AdminRequest) { return request.staff; }
  @Post("logout") @HttpCode(200) @UseGuards(AdminTokenGuard) @AllowStaff()
  logout(@Req() request: AdminRequest) { return this.security.logout(request.adminToken); }
  @Patch("password") @UseGuards(AdminTokenGuard) @AllowStaff()
  password(@Req() request: AdminRequest, @Body() dto: UpdateOwnPasswordDto) { return this.security.changePassword(request.staff, dto); }
}

@Controller("admin")
@UseGuards(AdminTokenGuard)
export class AdminStaffController {
  constructor(private readonly security: AdminSecurityService) {}
  @Get("permissions") @AllowStaff()
  permissions() { return PERMISSION_CATALOG; }
  @Get("staff") @RequirePermissions("staff.view")
  staff(@Query("limit") limit = "50", @Query("offset") offset = "0") { return this.security.listStaff(Number(limit), Number(offset)); }
  @Post("staff") @OwnerOnly()
  createStaff(@Req() request: AdminRequest, @Body() dto: CreateStaffDto) { return this.security.createStaff(request.staff, dto); }
  @Patch("staff/:id") @RequirePermissions("staff.edit")
  updateStaff(@Req() request: AdminRequest, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto) { return this.security.updateStaff(request.staff, id, dto); }
  @Patch("staff/:id/access") @OwnerOnly()
  updateAccess(@Req() request: AdminRequest, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateStaffAccessDto) { return this.security.updateAccess(request.staff, id, dto); }
  @Get("audit") @RequirePermissions("audit.view")
  audit(@Query("limit") limit = "50", @Query("offset") offset = "0", @Query("target") target?: string) { return this.security.auditLog(Number(limit), Number(offset), target); }
}
