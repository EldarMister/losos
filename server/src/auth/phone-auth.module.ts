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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PhoneAuthChallenge,
      AuthorizedPhone,
      PhoneAccount,
      DevicePushToken,
    ]),
  ],
  controllers: [PhoneAuthController],
  providers: [PhoneAuthService, NikitaOtpService, CaptchaVerificationService],
  exports: [PhoneAuthService],
})
export class PhoneAuthModule {}
