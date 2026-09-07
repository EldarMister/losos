import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Ip,
  Param,
  Post,
  Query,
  RawBody,
  Delete,
} from "@nestjs/common";
import {
  CheckWhatsappAuthDto,
  RequestPhoneCodeDto,
  RequestWhatsappAuthDto,
  VerifyPhoneCodeDto,
} from "./phone-auth.dto";
import {
  PhoneAuthService,
  type WhatsappWebhookPayload,
} from "./phone-auth.service";
import { WhatsappCloudService } from "./whatsapp-cloud.service";
import { RegisterPushTokenDto } from "./push-token.dto";
import { PushNotificationsService } from "../notifications/push-notifications.service";

@Controller("auth")
export class PhoneAuthController {
  constructor(
    private readonly auth: PhoneAuthService,
    private readonly whatsapp: WhatsappCloudService,
    private readonly push: PushNotificationsService,
  ) {}

  @Post("push-tokens")
  async registerPushToken(
    @Body() dto: RegisterPushTokenDto,
    @Headers("authorization") authorization: string | undefined,
  ) {
    const verificationToken = authorization?.replace(/^Bearer\s+/i, "").trim() || "";
    await this.auth.assertAccount(dto.phone, verificationToken);
    const token = await this.push.register(dto);
    return { deviceId: token.deviceId, registered: true };
  }

  @Delete("push-tokens/:deviceId")
  async removePushToken(
    @Param("deviceId") deviceId: string,
    @Query("phone") phone: string | undefined,
    @Headers("authorization") authorization: string | undefined,
  ) {
    const verificationToken = authorization?.replace(/^Bearer\s+/i, "").trim() || "";
    await this.auth.assertAccount(phone || "", verificationToken);
    return this.push.remove(phone || "", deviceId);
  }

  @Get("methods")
  methods() {
    return {
      whatsapp: this.whatsapp.isConfigured(),
      sms: true,
    };
  }

  @Get("profile")
  profile(
    @Query("phone") phone: string | undefined,
    @Headers("authorization") authorization: string | undefined,
  ) {
    const verificationToken = authorization?.replace(/^Bearer\s+/i, "").trim() || "";
    return this.auth.profile(phone || "", verificationToken);
  }

  @Delete("account")
  deleteAccount(
    @Query("phone") phone: string | undefined,
    @Headers("authorization") authorization: string | undefined,
  ) {
    const verificationToken = authorization?.replace(/^Bearer\s+/i, "").trim() || "";
    return this.auth.deleteAccount(phone || "", verificationToken);
  }

  @Get("orders/:id")
  orderDetails(
    @Param("id") id: string,
    @Query("phone") phone: string | undefined,
    @Headers("authorization") authorization: string | undefined,
  ) {
    const verificationToken = authorization?.replace(/^Bearer\s+/i, "").trim() || "";
    return this.auth.orderDetails(phone || "", verificationToken, id);
  }

  @Post("orders/:id/cancel")
  @HttpCode(200)
  cancelOrder(
    @Param("id") id: string,
    @Query("phone") phone: string | undefined,
    @Headers("authorization") authorization: string | undefined,
  ) {
    const verificationToken = authorization?.replace(/^Bearer\s+/i, "").trim() || "";
    return this.auth.cancelOrder(phone || "", verificationToken, id);
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

  @Post("whatsapp/request")
  @HttpCode(200)
  requestWhatsapp(@Body() dto: RequestWhatsappAuthDto) {
    return this.auth.requestWhatsapp(dto.phone);
  }

  @Post("whatsapp/status")
  @HttpCode(200)
  checkWhatsapp(@Body() dto: CheckWhatsappAuthDto) {
    return this.auth.checkWhatsapp(dto.challengeId, dto.pollToken);
  }

  @Get("whatsapp/webhook")
  verifyWhatsappWebhook(
    @Query("hub.mode") mode: string | undefined,
    @Query("hub.verify_token") token: string | undefined,
    @Query("hub.challenge") challenge: string | undefined,
  ) {
    this.whatsapp.assertWebhookVerification(mode, token);
    return challenge ?? "";
  }

  @Post("whatsapp/webhook")
  @HttpCode(200)
  async receiveWhatsappWebhook(
    @RawBody() rawBody: Buffer | undefined,
    @Headers("x-hub-signature-256") signature: string | undefined,
    @Body() payload: WhatsappWebhookPayload,
  ) {
    this.whatsapp.assertWebhookSignature(rawBody, signature);
    await this.auth.handleWhatsappWebhook(payload);
    return { received: true };
  }
}
