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
import { AddRegionContacts1784984000000 } from "./migrations/1784984000000-AddRegionContacts";
import { AddRegionPickupAndFooter1784985000000 } from "./migrations/1784985000000-AddRegionPickupAndFooter";
import { AddProductOldPrice1784986000000 } from "./migrations/1784986000000-AddProductOldPrice";
import { AddRegionDeliveryDetails1784987000000 } from "./migrations/1784987000000-AddRegionDeliveryDetails";
import { AddRegionDeliveryZone1784988000000 } from "./migrations/1784988000000-AddRegionDeliveryZone";
import { AddCaptchaProtectedPhoneAuth1784999000000 } from "./migrations/1784999000000-AddCaptchaProtectedPhoneAuth";
import { AddOrderRewardsAndNfts1785000000000 } from "./migrations/1785000000000-AddOrderRewardsAndNfts";
import { MoveNftRewardsToOrderMilestones1785001000000 } from "./migrations/1785001000000-MoveNftRewardsToOrderMilestones";
import { OrderItem } from "./orders/order-item.entity";
import { Order } from "./orders/order.entity";
import { AuthorizedPhone } from "./auth/authorized-phone.entity";
import { DevicePushToken } from "./auth/device-push-token.entity";
import { PhoneAccount } from "./auth/phone-account.entity";
import { PhoneAuthChallenge } from "./auth/phone-auth.entity";
import { AccountNft } from "./rewards/account-nft.entity";
import { NaktaCoinTransaction } from "./rewards/nakta-coin-transaction.entity";
import { AccountSession } from "./auth/account-session.entity";
import { AddMultiDeviceAccountSessions1785002000000 } from "./migrations/1785002000000-AddMultiDeviceAccountSessions";
import { AddNaktaCoinWithdrawals1785003000000 } from "./migrations/1785003000000-AddNaktaCoinWithdrawals";
import { NaktaCoinWithdrawal } from "./rewards/nakta-coin-withdrawal.entity";

try {
  process.loadEnvFile(".env");
} catch {
  // Railway injects environment variables; a local .env file is optional.
}

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://losos:losos@localhost:5432/losos";

export default new DataSource({
  type: "postgres",
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
    NaktaCoinWithdrawal,
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
    AddNaktaCoinWithdrawals1785003000000,
  ],
  synchronize: false,
  ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
});
