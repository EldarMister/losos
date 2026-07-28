import "reflect-metadata";
import { DataSource } from "typeorm";
import { Category } from "./catalog/category.entity";
import { Product } from "./catalog/product.entity";
import { Promotion } from "./catalog/promotion.entity";
import { Region } from "./catalog/region.entity";
import { PhoneAuthChallenge } from "./auth/phone-auth.entity";
import { BootstrapSchema1784978000000 } from "./migrations/1784978000000-BootstrapSchema";
import { AddProductCustomization1784979000000 } from "./migrations/1784979000000-AddProductCustomization";
import { AddProductionOrders1784980000000 } from "./migrations/1784980000000-AddProductionOrders";
import { AllowFractionalWeight1784981000000 } from "./migrations/1784981000000-AllowFractionalWeight";
import { AddOrderCoordinates1784982000000 } from "./migrations/1784982000000-AddOrderCoordinates";
import { AddScopedModifierPricing1784983000000 } from "./migrations/1784983000000-AddScopedModifierPricing";
import { AddRegionContacts1784984000000 } from "./migrations/1784984000000-AddRegionContacts";
import { AddRegionPickupAndFooter1784985000000 } from "./migrations/1784985000000-AddRegionPickupAndFooter";
import { AddRegionDeliverySchedule1784991000000 } from "./migrations/1784991000000-AddRegionDeliverySchedule";
import { AddProductOldPrice1784986000000 } from "./migrations/1784986000000-AddProductOldPrice";
import { AddCategoryImage1784987000000 } from "./migrations/1784987000000-AddCategoryImage";
import { AddPhoneAuth1784988000000 } from "./migrations/1784988000000-AddPhoneAuth";
import { AddWhatsappAuth1784989000000 } from "./migrations/1784989000000-AddWhatsappAuth";
import { AddRegionDeliverySettings1784990000000 } from "./migrations/1784990000000-AddRegionDeliverySettings";
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
  entities: [Region, Category, Product, Promotion, Order, OrderItem, PhoneAuthChallenge],
  migrations: [
    BootstrapSchema1784978000000,
    AddProductCustomization1784979000000,
    AddProductionOrders1784980000000,
    AllowFractionalWeight1784981000000,
    AddOrderCoordinates1784982000000,
    AddScopedModifierPricing1784983000000,
    AddRegionContacts1784984000000,
    AddRegionPickupAndFooter1784985000000,
    AddProductOldPrice1784986000000,
    AddCategoryImage1784987000000,
    AddPhoneAuth1784988000000,
    AddWhatsappAuth1784989000000,
    AddRegionDeliverySettings1784990000000,
    AddRegionDeliverySchedule1784991000000,
  ],
  synchronize: false,
  ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
});
