import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminModule } from "./admin/admin.module";
import { PhoneAuthChallenge } from "./auth/phone-auth.entity";
import { AuthorizedPhone } from "./auth/authorized-phone.entity";
import { PhoneAccount } from "./auth/phone-account.entity";
import { PhoneAuthModule } from "./auth/phone-auth.module";
import { CatalogModule } from "./catalog/catalog.module";
import { Category } from "./catalog/category.entity";
import { Product } from "./catalog/product.entity";
import { Promotion } from "./catalog/promotion.entity";
import { Region } from "./catalog/region.entity";
import { Order } from "./orders/order.entity";
import { OrderItem } from "./orders/order-item.entity";
import { OrdersModule } from "./orders/orders.module";
import { HealthController } from "./health.controller";
import { BootstrapSchema1784978000000 } from "./migrations/1784978000000-BootstrapSchema";
import { AddProductCustomization1784979000000 } from "./migrations/1784979000000-AddProductCustomization";
import { AddProductionOrders1784980000000 } from "./migrations/1784980000000-AddProductionOrders";
import { AllowFractionalWeight1784981000000 } from "./migrations/1784981000000-AllowFractionalWeight";
import { AddOrderCoordinates1784982000000 } from "./migrations/1784982000000-AddOrderCoordinates";
import { AddScopedModifierPricing1784983000000 } from "./migrations/1784983000000-AddScopedModifierPricing";
import { AddRegionContacts1784984000000 } from "./migrations/1784984000000-AddRegionContacts";
import { AddRegionPickupAndFooter1784985000000 } from "./migrations/1784985000000-AddRegionPickupAndFooter";
import { AddRegionDeliverySchedule1784991000000 } from "./migrations/1784991000000-AddRegionDeliverySchedule";
import { AddAuthorizedPhones1784992000000 } from "./migrations/1784992000000-AddAuthorizedPhones";
import { AddPhoneAccounts1784993000000 } from "./migrations/1784993000000-AddPhoneAccounts";
import { AddNaktaCoins1784994000000 } from "./migrations/1784994000000-AddNaktaCoins";
import { AddProductNaktaCoins1784995000000 } from "./migrations/1784995000000-AddProductNaktaCoins";
import { AddPickupLocationsAndPushTokens1784996000000 } from "./migrations/1784996000000-AddPickupLocationsAndPushTokens";
import { AddRegionDeliveryDetailsAndZone1784997000000 } from "./migrations/1784997000000-AddRegionDeliveryDetailsAndZone";
import { AddOrderCompletionAndSupportContact1784998000000 } from "./migrations/1784998000000-AddOrderCompletionAndSupportContact";
import { PickupLocation } from "./catalog/pickup-location.entity";
import { DevicePushToken } from "./auth/device-push-token.entity";
import { AddProductOldPrice1784986000000 } from "./migrations/1784986000000-AddProductOldPrice";
import { AddCategoryImage1784987000000 } from "./migrations/1784987000000-AddCategoryImage";
import { AddPhoneAuth1784988000000 } from "./migrations/1784988000000-AddPhoneAuth";
import { AddWhatsappAuth1784989000000 } from "./migrations/1784989000000-AddWhatsappAuth";
import { AddRegionDeliverySettings1784990000000 } from "./migrations/1784990000000-AddRegionDeliverySettings";
import { AddEduPosDeliveryIntegration1784999000000 } from "./migrations/1784999000000-AddEduPosDeliveryIntegration";
import { AddSharedRegionContentAndOtuzAdyr1785000000000 } from "./migrations/1785000000000-AddSharedRegionContentAndOtuzAdyr";

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
          entities: [Region, Category, Product, Promotion, PickupLocation, Order, OrderItem, PhoneAuthChallenge, AuthorizedPhone, PhoneAccount, DevicePushToken],
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
            AddAuthorizedPhones1784992000000,
            AddPhoneAccounts1784993000000,
            AddNaktaCoins1784994000000,
            AddProductNaktaCoins1784995000000,
            AddPickupLocationsAndPushTokens1784996000000,
            AddRegionDeliveryDetailsAndZone1784997000000,
            AddOrderCompletionAndSupportContact1784998000000,
            AddEduPosDeliveryIntegration1784999000000,
            AddSharedRegionContentAndOtuzAdyr1785000000000,
          ],
          migrationsRun: true,
          synchronize:
            config.get<string>("NODE_ENV") !== "production" &&
            config.get<string>("DB_SYNCHRONIZE") === "true",
          ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
        };
      },
    }),
    CatalogModule,
    PhoneAuthModule,
    AdminModule,
    OrdersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
