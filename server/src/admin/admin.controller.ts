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
import { ListOrdersQueryDto, UpdateOrderStatusDto } from "./admin-orders.dto";
import {
  CreateCategoryDto,
  CreateProductDto,
  CreatePromotionDto,
  CreateRegionDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdatePromotionDto,
  UpdateRegionDto,
  UpdateNftWithdrawalDto,
  UpdateNaktaCoinWithdrawalDto,
} from "./admin.dto";
import { AdminService } from "./admin.service";
import { AdminTokenGuard } from "./admin-token.guard";

@Controller("admin")
@UseGuards(AdminTokenGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("dashboard")
  dashboard(@Query("region") region = "bishkek") {
    return this.admin.dashboard(region);
  }

  @Get("settings")
  settings() {
    return this.admin.settings();
  }

  @Post("regions")
  createRegion(@Body() dto: CreateRegionDto) {
    return this.admin.createRegion(dto);
  }

  @Patch("regions/:id")
  updateRegion(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateRegionDto) {
    return this.admin.updateRegion(id, dto);
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

  @Get("nft-withdrawals")
  nftWithdrawals(@Query("status") status?: string) {
    return this.admin.nftWithdrawals(status);
  }

  @Patch("nft-withdrawals/:id")
  updateNftWithdrawal(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateNftWithdrawalDto,
  ) {
    return this.admin.updateNftWithdrawal(id, dto);
  }

  @Get("coin-withdrawals")
  coinWithdrawals(@Query("status") status?: string) {
    return this.admin.coinWithdrawals(status);
  }

  @Patch("coin-withdrawals/:id")
  updateCoinWithdrawal(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateNaktaCoinWithdrawalDto,
  ) {
    return this.admin.updateCoinWithdrawal(id, dto);
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
