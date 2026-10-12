import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  AdminAnalyticsQueryDto,
  AdminCustomersQueryDto,
  ListOrdersQueryDto,
  UpdateOrderKitDto,
  UpdateOrderStatusDto,
} from "./admin-orders.dto";
import {
  CreateCategoryDto,
  CreateProductDto,
  CreatePromotionDto,
  CreateRegionDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdatePromotionDto,
  UpdateRegionDto,
  CreatePickupLocationDto,
  ResolvePickupMapLinkDto,
  UpdatePickupLocationDto,
} from "./admin.dto";
import { AdminService } from "./admin.service";
import { AdminTokenGuard, type AdminRequest } from "./admin-token.guard";
import { EduPosService } from "../edu-pos/edu-pos.service";
import { AllowStaff, AnyPermission, assertProductFields, assertRegionFields, RequirePermissions } from "./admin-permissions";
import { AdminAuditInterceptor } from "./admin-audit.interceptor";
import { AdminSecurityService } from "./admin-security.service";
import { UpdateCustomerProfileDto } from "./admin-security.dto";
import { filterAdminDashboard, filterAdminProduct, filterAdminRegion } from "./admin-payload-access";

@Controller("admin")
@UseGuards(AdminTokenGuard)
@UseInterceptors(AdminAuditInterceptor)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly eduPos: EduPosService,
    private readonly security: AdminSecurityService,
  ) {}

  @Get("dashboard")
  @AnyPermission("dashboard.view", "products.view", "categories.view", "modifiers.view", "kits.view", "promotions.view", "cities.view", "settings.view")
  async dashboard(@Req() request: AdminRequest, @Query("region") region = "bishkek") {
    return filterAdminDashboard(await this.admin.dashboard(region), request.staff);
  }

  @Get("settings")
  @AllowStaff()
  async settings(@Req() request: AdminRequest) {
    return (await this.admin.settings()).map(region => filterAdminRegion(region, request.staff));
  }

  @Get("analytics")
  @RequirePermissions("analytics.view")
  analytics(@Query() query: AdminAnalyticsQueryDto) {
    return this.admin.analytics(query.region, query.period);
  }

  @Get("customers")
  @RequirePermissions("customers.view")
  customers(@Query() query: AdminCustomersQueryDto) {
    return this.admin.customers(query.region, query.search, query.limit, query.offset);
  }

  @Get("customers/:phone")
  @RequirePermissions("customers.view")
  async customer(
    @Param("phone") phone: string,
    @Query("region") region = "bishkek",
    @Query("limit") limit = "25",
    @Query("offset") offset = "0",
  ) {
    return { ...await this.admin.customer(phone, region, Number(limit), Number(offset)), profile: await this.security.customerProfile(phone) };
  }

  @Patch("customers/:phone")
  @RequirePermissions("customers.edit")
  updateCustomer(@Req() request: AdminRequest, @Param("phone") phone: string, @Body() dto: UpdateCustomerProfileDto) {
    return this.security.updateCustomer(request.staff, phone, dto);
  }

  @Get("edu-pos/status")
  @RequirePermissions("integrations.view")
  eduPosStatus() {
    return this.eduPos.status();
  }

  @Post("edu-pos/check")
  @RequirePermissions("integrations.edit")
  checkEduPosConnection() {
    return this.eduPos.checkConnection();
  }

  @Post("edu-pos/sync-menu")
  @RequirePermissions("integrations.edit", "products.edit", "categories.edit", "modifiers.edit")
  syncEduPosMenu() {
    return this.eduPos.syncMenu();
  }

  @Post("edu-pos/sync-stop-list")
  @RequirePermissions("integrations.edit", "products.edit")
  syncEduPosStopList() {
    return this.eduPos.syncStopList();
  }

  @Post("edu-pos/export-menu")
  @RequirePermissions("integrations.export", "products.view", "categories.view", "modifiers.view")
  exportEduPosMenu(@Query("region") region = "bishkek") {
    return this.eduPos.exportMenu(region);
  }

  @Post("regions")
  @RequirePermissions("cities.create")
  async createRegion(@Req() request: AdminRequest, @Body() dto: CreateRegionDto) {
    assertRegionFields(request.staff, request.body || {}, true);
    return filterAdminRegion(await this.admin.createRegion(dto), request.staff);
  }

  @Patch("regions/:id")
  @AnyPermission("cities.edit", "hours.edit", "settings.edit", "kits.edit")
  async updateRegion(@Req() request: AdminRequest, @Param("id", ParseIntPipe) id: number, @Body() dto: UpdateRegionDto) {
    assertRegionFields(request.staff, request.body || {});
    return filterAdminRegion(await this.admin.updateRegion(id, dto), request.staff);
  }

  @Post("pickup-locations")
  @RequirePermissions("cities.create")
  createPickupLocation(@Body() dto: CreatePickupLocationDto) {
    return this.admin.createPickupLocation(dto);
  }

  @Post("pickup-locations/resolve-map-link")
  @AnyPermission("cities.create", "cities.edit")
  resolvePickupMapLink(@Body() dto: ResolvePickupMapLinkDto) {
    return this.admin.resolvePickupMapLink(dto.yandexUrl);
  }

  @Patch("pickup-locations/:id")
  @RequirePermissions("cities.edit")
  updatePickupLocation(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePickupLocationDto,
  ) {
    return this.admin.updatePickupLocation(id, dto);
  }

  @Delete("pickup-locations/:id")
  @RequirePermissions("cities.delete")
  deletePickupLocation(@Param("id", ParseIntPipe) id: number) {
    return this.admin.deletePickupLocation(id);
  }

  @Get("orders")
  @RequirePermissions("orders.view")
  orders(@Query() query: ListOrdersQueryDto) {
    return this.admin.orders(query);
  }

  @Get("orders/:id")
  @RequirePermissions("orders.view")
  order(@Param("id", ParseUUIDPipe) id: string) {
    return this.admin.order(id);
  }

  @Patch("orders/:id/status")
  @RequirePermissions("orders.status")
  updateOrderStatus(
    @Req() request: AdminRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.admin.updateOrderStatus(id, dto.status, dto.expectedStatus, dto.expectedUpdatedAt, request.staff);
  }

  @Patch("orders/:id/kit")
  @RequirePermissions("orders.edit")
  updateOrderKit(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderKitDto,
  ) {
    return this.admin.updateOrderKit(id, dto);
  }

  @Post("categories")
  @RequirePermissions("categories.create")
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.admin.createCategory(dto);
  }

  @Patch("categories/:id")
  @RequirePermissions("categories.edit")
  updateCategory(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.admin.updateCategory(id, dto);
  }

  @Delete("categories/:id")
  @RequirePermissions("categories.delete")
  deleteCategory(@Param("id", ParseIntPipe) id: number) {
    return this.admin.deleteCategory(id);
  }

  @Post("products")
  @RequirePermissions("products.create")
  async createProduct(@Req() request: AdminRequest, @Body() dto: CreateProductDto) {
    assertProductFields(request.staff, request.body || {}, true);
    return filterAdminProduct(await this.admin.createProduct(dto), request.staff);
  }

  @Patch("products/:id")
  @AnyPermission("products.edit", "modifiers.edit", "kits.edit")
  async updateProduct(@Req() request: AdminRequest, @Param("id", ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    assertProductFields(request.staff, request.body || {});
    return filterAdminProduct(await this.admin.updateProduct(id, dto), request.staff);
  }

  @Delete("products/:id")
  @RequirePermissions("products.delete")
  deleteProduct(@Param("id", ParseIntPipe) id: number) {
    return this.admin.deleteProduct(id);
  }

  @Post("promotions")
  @RequirePermissions("promotions.create")
  createPromotion(@Body() dto: CreatePromotionDto) {
    return this.admin.createPromotion(dto);
  }

  @Patch("promotions/:id")
  @RequirePermissions("promotions.edit")
  updatePromotion(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePromotionDto) {
    return this.admin.updatePromotion(id, dto);
  }

  @Delete("promotions/:id")
  @RequirePermissions("promotions.delete")
  deletePromotion(@Param("id", ParseIntPipe) id: number) {
    return this.admin.deletePromotion(id);
  }
}
