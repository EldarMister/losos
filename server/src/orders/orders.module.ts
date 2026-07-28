import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PhoneAuthModule } from "../auth/phone-auth.module";
import { Product } from "../catalog/product.entity";
import { OrderItem } from "./order-item.entity";
import { Order } from "./order.entity";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { EduPosIntegrationService } from "./edu-pos-integration.service";

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product]), PhoneAuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, EduPosIntegrationService],
})
export class OrdersModule {}
