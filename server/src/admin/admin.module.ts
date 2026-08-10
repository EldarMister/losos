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
import { PushNotificationsModule } from "../notifications/push-notifications.module";
import { PickupLocation } from "../catalog/pickup-location.entity";
import { EduPosModule } from "../edu-pos/edu-pos.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Region, PickupLocation, Category, Product, Promotion, Order, OrderItem]),
    PushNotificationsModule,
    EduPosModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminTokenGuard],
})
export class AdminModule {}
