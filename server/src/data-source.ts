import "reflect-metadata";
import { DataSource } from "typeorm";
import { Category } from "./catalog/category.entity";
import { Product } from "./catalog/product.entity";
import { Promotion } from "./catalog/promotion.entity";
import { Region } from "./catalog/region.entity";
import { BootstrapSchema1784978000000 } from "./migrations/1784978000000-BootstrapSchema";
import { AddProductCustomization1784979000000 } from "./migrations/1784979000000-AddProductCustomization";
import { AddProductionOrders1784980000000 } from "./migrations/1784980000000-AddProductionOrders";
import { AllowFractionalWeight1784981000000 } from "./migrations/1784981000000-AllowFractionalWeight";
import { AddOrderCoordinates1784982000000 } from "./migrations/1784982000000-AddOrderCoordinates";
import { AddScopedModifierPricing1784983000000 } from "./migrations/1784983000000-AddScopedModifierPricing";
import { AddProductOldPrice1784986000000 } from "./migrations/1784986000000-AddProductOldPrice";
import { OrderItem } from "./orders/order-item.entity";
import { Order } from "./orders/order.entity";

try {
  process.loadEnvFile(".env");
} catch {
  // Railway injects environment variables; a local .env file is optional.
}

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://losos:losos@localhost:5432/losos";

export default new DataSource({
  type: "postgres",
  url: databaseUrl,
  entities: [Region, Category, Product, Promotion, Order, OrderItem],
  migrations: [
    BootstrapSchema1784978000000,
    AddProductCustomization1784979000000,
    AddProductionOrders1784980000000,
    AllowFractionalWeight1784981000000,
    AddOrderCoordinates1784982000000,
    AddScopedModifierPricing1784983000000,
    AddProductOldPrice1784986000000,
  ],
  synchronize: false,
  ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
});
