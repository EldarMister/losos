import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthorizedPhone } from "./authorized-phone.entity";
import { CaptchaVerificationService } from "./captcha-verification.service";
import { DevicePushToken } from "./device-push-token.entity";
import { NikitaOtpService } from "./nikita-otp.service";
import { PhoneAccount } from "./phone-account.entity";
import { PhoneAuthController } from "./phone-auth.controller";
import { PhoneAuthChallenge } from "./phone-auth.entity";
import { PhoneAuthService } from "./phone-auth.service";
import { AccountNft } from "../rewards/account-nft.entity";
import { NaktaCoinTransaction } from "../rewards/nakta-coin-transaction.entity";
import { AccountSession } from "./account-session.entity";
import { NaktaCoinWithdrawal } from "../rewards/nakta-coin-withdrawal.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PhoneAuthChallenge,
      AuthorizedPhone,
      PhoneAccount,
      DevicePushToken,
      AccountNft,
      NaktaCoinTransaction,
      AccountSession,
      NaktaCoinWithdrawal,
    ]),
  ],
  controllers: [PhoneAuthController],
  providers: [PhoneAuthService, NikitaOtpService, CaptchaVerificationService],
  exports: [PhoneAuthService],
})
export class PhoneAuthModule {}
