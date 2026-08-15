import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import {
  RegisterPushTokenDto,
  RequestPhoneCodeDto,
  VerifyPhoneCodeDto,
  WithdrawNftDto,
} from "./phone-auth.dto";
import { PhoneAuthService } from "./phone-auth.service";

function bearerToken(authorization: string | undefined) {
  return authorization?.replace(/^Bearer\s+/i, "").trim() || "";
}

@Controller("auth")
export class PhoneAuthController {
  constructor(private readonly auth: PhoneAuthService) {}

  @Get("methods")
  methods() {
    return { whatsapp: false, sms: true };
  }

  @Post("request-code")
  @HttpCode(200)
  requestCode(@Body() dto: RequestPhoneCodeDto, @Ip() remoteIp: string) {
    return this.auth.requestCode(dto.phone, dto.captchaToken, remoteIp);
  }

  @Post("verify-code")
  @HttpCode(200)
  verifyCode(@Body() dto: VerifyPhoneCodeDto) {
    return this.auth.verifyCode(dto.phone, dto.code);
  }

  @Get("profile")
  profile(
    @Query("phone") phone: string | undefined,
    @Headers("authorization") authorization: string | undefined,
  ) {
    return this.auth.profile(phone || "", bearerToken(authorization));
  }

  @Get("orders/:id")
  orderDetails(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("phone") phone: string | undefined,
    @Headers("authorization") authorization: string | undefined,
  ) {
    return this.auth.orderDetails(phone || "", bearerToken(authorization), id);
  }

  @Post("nfts/:id/withdraw")
  @HttpCode(200)
  withdrawNft(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("phone") phone: string | undefined,
    @Headers("authorization") authorization: string | undefined,
    @Body() dto: WithdrawNftDto,
  ) {
    return this.auth.withdrawNft(
      phone || "",
      bearerToken(authorization),
      id,
      dto.walletAddress,
    );
  }

  @Delete("account")
  deleteAccount(
    @Query("phone") phone: string | undefined,
    @Headers("authorization") authorization: string | undefined,
  ) {
    return this.auth.deleteAccount(phone || "", bearerToken(authorization));
  }

  @Post("push-tokens")
  async registerPushToken(
    @Body() dto: RegisterPushTokenDto,
    @Headers("authorization") authorization: string | undefined,
  ) {
    await this.auth.assertAccount(dto.phone, bearerToken(authorization));
    return this.auth.registerPushToken(dto);
  }

  @Delete("push-tokens/:deviceId")
  async removePushToken(
    @Param("deviceId") deviceId: string,
    @Query("phone") phone: string | undefined,
    @Headers("authorization") authorization: string | undefined,
  ) {
    await this.auth.assertAccount(phone || "", bearerToken(authorization));
    return this.auth.removePushToken(phone || "", deviceId);
  }
}
