import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "../catalog/product.entity";
import { OrderItem } from "../orders/order-item.entity";
import { Order } from "../orders/order.entity";
import { EduPosClient } from "./edu-pos.client";
import { EduPosService } from "./edu-pos.service";

@Module({
  imports: [TypeOrmModule.forFeature([Product, Order, OrderItem])],
  providers: [EduPosClient, EduPosService],
  exports: [EduPosClient, EduPosService],
})
export class EduPosModule {}

