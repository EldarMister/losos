import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminModule } from "./admin/admin.module";
import { CatalogModule } from "./catalog/catalog.module";
import { Category } from "./catalog/category.entity";
import { Product } from "./catalog/product.entity";
import { Promotion } from "./catalog/promotion.entity";
import { Region } from "./catalog/region.entity";
import { Order } from "./orders/order.entity";
import { OrderItem } from "./orders/order-item.entity";
import { OrdersModule } from "./orders/orders.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl =
          config.get<string>("DATABASE_URL") ?? "postgresql://losos:losos@localhost:5432/losos";
        return {
          type: "postgres" as const,
          url: databaseUrl,
          entities: [Region, Category, Product, Promotion, Order, OrderItem],
          synchronize:
            config.get<string>("DB_SYNCHRONIZE") === "true" ||
            config.get<string>("NODE_ENV") !== "production",
          ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
        };
      },
    }),
    CatalogModule,
    AdminModule,
    OrdersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
