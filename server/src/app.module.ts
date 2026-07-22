import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogModule } from "./catalog/catalog.module";
import { Category } from "./catalog/category.entity";
import { Product } from "./catalog/product.entity";
import { Order } from "./orders/order.entity";
import { OrderItem } from "./orders/order-item.entity";
import { OrdersModule } from "./orders/orders.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres" as const,
        url: config.get<string>("DATABASE_URL") ?? "postgresql://losos:losos@localhost:5432/losos",
        entities: [Category, Product, Order, OrderItem],
        synchronize: config.get<string>("NODE_ENV") !== "production",
      }),
    }),
    CatalogModule,
    OrdersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
