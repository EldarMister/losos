import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "../catalog/category.entity";
import { Product } from "../catalog/product.entity";
import { Promotion } from "../catalog/promotion.entity";
import { Region } from "../catalog/region.entity";
import { OrderItem } from "../orders/order-item.entity";
import { Order } from "../orders/order.entity";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminTokenGuard } from "./admin-token.guard";
import { RealtimeModule } from "../realtime/realtime.module";

@Module({
  imports: [TypeOrmModule.forFeature([Region, Category, Product, Promotion, Order, OrderItem]), RealtimeModule],
  controllers: [AdminController],
  providers: [AdminService, AdminTokenGuard],
})
export class AdminModule {}
