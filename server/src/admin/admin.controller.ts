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
  UseGuards,
} from "@nestjs/common";
import {
  AdminAnalyticsQueryDto,
  AdminCustomersQueryDto,
  AdminNftWithdrawalsQueryDto,
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
  UpdateNftWithdrawalDto,
  UpdateNaktaCoinWithdrawalDto,
} from "./admin.dto";
import { AdminService } from "./admin.service";
import { AdminTokenGuard } from "./admin-token.guard";
import { EduPosService } from "../edu-pos/edu-pos.service";

@Controller("admin")
@UseGuards(AdminTokenGuard)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly eduPos: EduPosService,
  ) {}

  @Get("dashboard")
  dashboard(@Query("region") region = "bishkek") {
    return this.admin.dashboard(region);
  }

  @Get("settings")
  settings() {
    return this.admin.settings();
  }

  @Get("analytics")
  analytics(@Query() query: AdminAnalyticsQueryDto) {
    return this.admin.analytics(query.region, query.period);
  }

  @Get("loyalty/overview")
  loyaltyOverview(@Query("region") region = "bishkek") {
    return this.admin.loyaltyOverview(region);
  }

  @Get("customers")
  customers(@Query() query: AdminCustomersQueryDto) {
    return this.admin.customers(query.region, query.search, query.limit, query.offset);
  }

  @Get("nft-withdrawals")
  nftWithdrawals(@Query() query: AdminNftWithdrawalsQueryDto) {
    return this.admin.nftWithdrawals(query.region, query.status);
  }

  @Patch("nft-withdrawals/:id")
  updateNftWithdrawal(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateNftWithdrawalDto,
  ) {
    return this.admin.updateNftWithdrawal(id, dto);
  }

  @Get("coin-withdrawals")
  coinWithdrawals(
    @Query("region") region?: string,
    @Query("status") status?: string,
  ) {
    return this.admin.coinWithdrawals(region, status);
  }

  @Patch("coin-withdrawals/:id")
  updateCoinWithdrawal(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateNaktaCoinWithdrawalDto,
  ) {
    return this.admin.updateCoinWithdrawal(id, dto);
  }

  @Get("edu-pos/status")
  eduPosStatus() {
    return this.eduPos.status();
  }

  @Post("edu-pos/sync-menu")
  syncEduPosMenu() {
    return this.eduPos.syncMenu();
  }

  @Post("edu-pos/sync-stop-list")
  syncEduPosStopList() {
    return this.eduPos.syncStopList();
  }

  @Post("edu-pos/export-menu")
  exportEduPosMenu(@Query("region") region = "bishkek") {
    return this.eduPos.exportMenu(region);
  }

  @Post("regions")
  createRegion(@Body() dto: CreateRegionDto) {
    return this.admin.createRegion(dto);
  }

  @Patch("regions/:id")
  updateRegion(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateRegionDto) {
    return this.admin.updateRegion(id, dto);
  }

  @Post("pickup-locations")
  createPickupLocation(@Body() dto: CreatePickupLocationDto) {
    return this.admin.createPickupLocation(dto);
  }

  @Post("pickup-locations/resolve-map-link")
  resolvePickupMapLink(@Body() dto: ResolvePickupMapLinkDto) {
    return this.admin.resolvePickupMapLink(dto.yandexUrl);
  }

  @Patch("pickup-locations/:id")
  updatePickupLocation(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePickupLocationDto,
  ) {
    return this.admin.updatePickupLocation(id, dto);
  }

  @Delete("pickup-locations/:id")
  deletePickupLocation(@Param("id", ParseIntPipe) id: number) {
    return this.admin.deletePickupLocation(id);
  }

  @Get("orders")
  orders(@Query() query: ListOrdersQueryDto) {
    return this.admin.orders(query);
  }

  @Get("orders/:id")
  order(@Param("id", ParseUUIDPipe) id: string) {
    return this.admin.order(id);
  }

  @Patch("orders/:id/status")
  updateOrderStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.admin.updateOrderStatus(id, dto.status);
  }

  @Patch("orders/:id/kit")
  updateOrderKit(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderKitDto,
  ) {
    return this.admin.updateOrderKit(id, dto);
  }

  @Post("categories")
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.admin.createCategory(dto);
  }

  @Patch("categories/:id")
  updateCategory(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.admin.updateCategory(id, dto);
  }

  @Delete("categories/:id")
  deleteCategory(@Param("id", ParseIntPipe) id: number) {
    return this.admin.deleteCategory(id);
  }

  @Post("products")
  createProduct(@Body() dto: CreateProductDto) {
    return this.admin.createProduct(dto);
  }

  @Patch("products/:id")
  updateProduct(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.admin.updateProduct(id, dto);
  }

  @Delete("products/:id")
  deleteProduct(@Param("id", ParseIntPipe) id: number) {
    return this.admin.deleteProduct(id);
  }

  @Post("promotions")
  createPromotion(@Body() dto: CreatePromotionDto) {
    return this.admin.createPromotion(dto);
  }

  @Patch("promotions/:id")
  updatePromotion(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePromotionDto) {
    return this.admin.updatePromotion(id, dto);
  }

  @Delete("promotions/:id")
  deletePromotion(@Param("id", ParseIntPipe) id: number) {
    return this.admin.deletePromotion(id);
  }
}
