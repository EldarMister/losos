import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NikitaOtpService } from "./nikita-otp.service";
import { AuthorizedPhone } from "./authorized-phone.entity";
import { PhoneAccount } from "./phone-account.entity";
import { PhoneAuthController } from "./phone-auth.controller";
import { PhoneAuthChallenge } from "./phone-auth.entity";
import { PhoneAuthService } from "./phone-auth.service";
import { WhatsappCloudService } from "./whatsapp-cloud.service";
import { PushNotificationsModule } from "../notifications/push-notifications.module";
import { CaptchaVerificationService } from "./captcha-verification.service";
import { PhoneAccountSession } from "./phone-account-session.entity";
import { AccountNft } from "../rewards/account-nft.entity";
import { NaktaCoinTransaction } from "../rewards/nakta-coin-transaction.entity";
import { NaktaCoinWithdrawal } from "../rewards/nakta-coin-withdrawal.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PhoneAuthChallenge,
      AuthorizedPhone,
      PhoneAccount,
      PhoneAccountSession,
      AccountNft,
      NaktaCoinTransaction,
      NaktaCoinWithdrawal,
    ]),
    PushNotificationsModule,
  ],
  controllers: [PhoneAuthController],
  providers: [
    PhoneAuthService,
    NikitaOtpService,
    WhatsappCloudService,
    CaptchaVerificationService,
  ],
  exports: [PhoneAuthService],
})
export class PhoneAuthModule {}
