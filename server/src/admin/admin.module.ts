import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "../catalog/category.entity";
import { Product } from "../catalog/product.entity";
import { Promotion } from "../catalog/promotion.entity";
import { Region } from "../catalog/region.entity";
import { OrderItem } from "../orders/order-item.entity";
import { Order } from "../orders/order.entity";
import { PhoneAccount } from "../auth/phone-account.entity";
import { AccountNft } from "../rewards/account-nft.entity";
import { NaktaCoinTransaction } from "../rewards/nakta-coin-transaction.entity";
import { NaktaCoinWithdrawal } from "../rewards/nakta-coin-withdrawal.entity";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminTokenGuard } from "./admin-token.guard";

@Module({
  imports: [TypeOrmModule.forFeature([
    Region,
    Category,
    Product,
    Promotion,
    Order,
    OrderItem,
    PhoneAccount,
    AccountNft,
    NaktaCoinTransaction,
    NaktaCoinWithdrawal,
  ])],
  controllers: [AdminController],
  providers: [AdminService, AdminTokenGuard],
})
export class AdminModule {}
