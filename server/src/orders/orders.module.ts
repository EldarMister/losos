import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "../catalog/product.entity";
import { OrderItem } from "./order-item.entity";
import { Order } from "./order.entity";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { RealtimeModule } from "../realtime/realtime.module";

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product]), RealtimeModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
