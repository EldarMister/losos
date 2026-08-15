import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminModule } from "./admin/admin.module";
import { AuthorizedPhone } from "./auth/authorized-phone.entity";
import { DevicePushToken } from "./auth/device-push-token.entity";
import { PhoneAccount } from "./auth/phone-account.entity";
import { PhoneAuthChallenge } from "./auth/phone-auth.entity";
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
import { AddProductOldPrice1784986000000 } from "./migrations/1784986000000-AddProductOldPrice";
import { AddRegionDeliveryDetails1784987000000 } from "./migrations/1784987000000-AddRegionDeliveryDetails";
import { AddRegionDeliveryZone1784988000000 } from "./migrations/1784988000000-AddRegionDeliveryZone";
import { AddCaptchaProtectedPhoneAuth1784999000000 } from "./migrations/1784999000000-AddCaptchaProtectedPhoneAuth";
import { AddOrderRewardsAndNfts1785000000000 } from "./migrations/1785000000000-AddOrderRewardsAndNfts";
import { MoveNftRewardsToOrderMilestones1785001000000 } from "./migrations/1785001000000-MoveNftRewardsToOrderMilestones";
import { AccountNft } from "./rewards/account-nft.entity";
import { NaktaCoinTransaction } from "./rewards/nakta-coin-transaction.entity";
import { AccountSession } from "./auth/account-session.entity";
import { AddMultiDeviceAccountSessions1785002000000 } from "./migrations/1785002000000-AddMultiDeviceAccountSessions";

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
          entities: [
            Region,
            Category,
            Product,
            Promotion,
            Order,
            OrderItem,
            PhoneAuthChallenge,
            AuthorizedPhone,
            PhoneAccount,
            DevicePushToken,
            AccountNft,
            NaktaCoinTransaction,
            AccountSession,
          ],
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
            AddRegionDeliveryDetails1784987000000,
            AddRegionDeliveryZone1784988000000,
            AddCaptchaProtectedPhoneAuth1784999000000,
            AddOrderRewardsAndNfts1785000000000,
            MoveNftRewardsToOrderMilestones1785001000000,
            AddMultiDeviceAccountSessions1785002000000,
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
