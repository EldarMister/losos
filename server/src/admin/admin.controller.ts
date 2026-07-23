import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  CreateCategoryDto,
  CreateProductDto,
  CreatePromotionDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdatePromotionDto,
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
