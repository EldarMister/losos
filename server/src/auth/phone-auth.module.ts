import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NikitaOtpService } from "./nikita-otp.service";
import { AuthorizedPhone } from "./authorized-phone.entity";
import { PhoneAuthController } from "./phone-auth.controller";
import { PhoneAuthChallenge } from "./phone-auth.entity";
import { PhoneAuthService } from "./phone-auth.service";
import { WhatsappCloudService } from "./whatsapp-cloud.service";

@Module({
  imports: [TypeOrmModule.forFeature([PhoneAuthChallenge, AuthorizedPhone])],
  controllers: [PhoneAuthController],
  providers: [PhoneAuthService, NikitaOtpService, WhatsappCloudService],
  exports: [PhoneAuthService],
})
export class PhoneAuthModule {}
