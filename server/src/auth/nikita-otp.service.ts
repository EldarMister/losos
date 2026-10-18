import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isNikitaSmsToken, NikitaSmsError, sendNikitaSmsCode, verifyNikitaSmsCode } from "./nikita-sms";

type NikitaOtpResponse = {
  token?: string;
  status?: number | string;
  description?: string;
};

@Injectable()
export class NikitaOtpService {
  constructor(private readonly config: ConfigService) {}

  async send(phone: string, transactionId: string) {
    try {
      return await sendNikitaSmsCode({
        login: this.config.get<string>("NIKITA_SMS_LOGIN") || "",
        password: this.config.get<string>("NIKITA_SMS_PASSWORD") || "",
        secret: this.config.get<string>("OTP_HASH_SECRET") || "",
        sender: "NktaSushiKG",
        brand: "NAKTA SUSHI",
        phone,
        transactionId,
      });
    } catch (error) {
      if (error instanceof NikitaSmsError) throw new ServiceUnavailableException(error.message);
      throw error;
    }
  }

  async verify(token: string, code: string) {
    if (isNikitaSmsToken(token)) {
      try {
        return verifyNikitaSmsCode(this.config.get<string>("OTP_HASH_SECRET") || "", "NktaSushiKG", token, code);
      } catch (error) {
        if (error instanceof NikitaSmsError) throw new ServiceUnavailableException(error.message);
        throw error;
      }
    }
    // Finish verification of OTP challenges issued before the sender migration.
    const result = await this.request("/api/otp/verify", { token, code });
    return {
      valid: String(result.status) === "0",
      status: String(result.status ?? ""),
      description: result.description || "",
    };
  }

  private async request(path: string, body: Record<string, string>) {
    const apiKey = this.config.get<string>("NIKITA_OTP_API_KEY")?.trim();
    if (!apiKey) throw new ServiceUnavailableException("Отправка SMS пока не настроена");

    let response: Response;
    try {
      response = await fetch(`https://smspro.nikita.kg${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      console.error("Nikita OTP request failed", { path, error });
      throw new ServiceUnavailableException("Сервис SMS временно недоступен");
    }

    const result = await response.json().catch(() => null) as NikitaOtpResponse | null;
    if (!response.ok || !result) {
      console.error("Nikita OTP returned an invalid response", { path, httpStatus: response.status });
      throw new ServiceUnavailableException("Сервис SMS временно недоступен");
    }
    return result;
  }
}
