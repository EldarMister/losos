import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { RequestPhoneCodeDto, VerifyPhoneCodeDto } from "./phone-auth.dto";
import { PhoneAuthService } from "./phone-auth.service";

@Controller("auth")
export class PhoneAuthController {
  constructor(private readonly auth: PhoneAuthService) {}

  @Post("request-code")
  @HttpCode(200)
  requestCode(@Body() dto: RequestPhoneCodeDto) {
    return this.auth.requestCode(dto.phone);
  }

  @Post("verify-code")
  @HttpCode(200)
  verifyCode(@Body() dto: VerifyPhoneCodeDto) {
    return this.auth.verifyCode(dto.phone, dto.code);
  }
}
