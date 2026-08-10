import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PhoneAuthModule } from "../auth/phone-auth.module";
import { Product } from "../catalog/product.entity";
import { Region } from "../catalog/region.entity";
import { EduPosModule } from "../edu-pos/edu-pos.module";
import { OrderItem } from "./order-item.entity";
import { Order } from "./order.entity";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product, Region]), PhoneAuthModule, EduPosModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
