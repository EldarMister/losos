import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";

@Injectable()
export class WhatsappCloudService {
  constructor(private readonly config: ConfigService) {}

  createAuthUrl(code: string) {
    const botPhone = this.config
      .get<string>("WHATSAPP_BOT_PHONE")
      ?.replace(/\D/g, "");
    if (!botPhone || botPhone.length < 10 || botPhone.length > 15) {
      throw new ServiceUnavailableException("Авторизация через WhatsApp пока не настроена");
    }
    const message = [
      "Подтверждаю номер телефона в NAKTA SUSHI.",
      `Код: ${code}`,
      "",
      "Отправьте это сообщение без изменений.",
    ].join("\n");
    return `https://wa.me/${botPhone}?text=${encodeURIComponent(message)}`;
  }

  assertWebhookVerification(mode: string | undefined, token: string | undefined) {
    const verifyToken = this.config.get<string>("WHATSAPP_WEBHOOK_VERIFY_TOKEN");
    if (!verifyToken || mode !== "subscribe" || !token || !this.safeEqual(token, verifyToken)) {
      throw new UnauthorizedException("Invalid WhatsApp webhook verification");
    }
  }

  assertWebhookSignature(rawBody: Buffer | undefined, signature: string | undefined) {
    const appSecret = this.config.get<string>("WHATSAPP_APP_SECRET");
    if (!appSecret || !rawBody || !signature) {
      throw new UnauthorizedException("Invalid WhatsApp webhook signature");
    }
    const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
    if (!this.safeEqual(signature, expected)) {
      throw new UnauthorizedException("Invalid WhatsApp webhook signature");
    }
  }

  acceptsPhoneNumberId(phoneNumberId: string | undefined) {
    const configured = this.config.get<string>("WHATSAPP_PHONE_NUMBER_ID")?.trim();
    return Boolean(configured && phoneNumberId && configured === phoneNumberId);
  }

  async sendText(to: string, body: string) {
    const accessToken = this.config.get<string>("WHATSAPP_ACCESS_TOKEN")?.trim();
    const phoneNumberId = this.config.get<string>("WHATSAPP_PHONE_NUMBER_ID")?.trim();
    const configuredVersion = this.config
      .get<string>("WHATSAPP_GRAPH_API_VERSION")
      ?.trim();
    const apiVersion = configuredVersion && /^v\d+\.\d+$/.test(configuredVersion)
      ? configuredVersion
      : "v23.0";
    if (!accessToken || !phoneNumberId) {
      console.error("WhatsApp reply skipped: Cloud API credentials are missing");
      return false;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: { preview_url: false, body },
          }),
          signal: AbortSignal.timeout(15_000),
        },
      );
      if (!response.ok) {
        const responseBody = await response.text().catch(() => "");
        console.error("WhatsApp Cloud API rejected bot reply", {
          httpStatus: response.status,
          responseBody: responseBody.slice(0, 500),
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error("WhatsApp Cloud API reply failed", { error });
      return false;
    }
  }

  private safeEqual(left: string, right: string) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length
      && timingSafeEqual(leftBuffer, rightBuffer);
  }
}
