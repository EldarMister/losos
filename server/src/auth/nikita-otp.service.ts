import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type NikitaOtpResponse = {
  token?: string;
  status?: number | string;
  description?: string;
};

@Injectable()
export class NikitaOtpService {
  constructor(private readonly config: ConfigService) {}

  async send(phone: string, transactionId: string) {
    const result = await this.request("/api/otp/send", {
      transaction_id: transactionId,
      phone: phone.replace(/^\+/, ""),
    });
    if (String(result.status) !== "0" || !result.token) {
      this.throwProviderError(result, "Не удалось отправить SMS");
    }
    return result.token;
  }

  async verify(token: string, code: string) {
    const result = await this.request("/api/otp/verify", { token, code });
    return {
      valid: String(result.status) === "0",
      status: String(result.status ?? ""),
      description: result.description || "",
    };
  }

  private async request(path: string, body: Record<string, string>) {
    const apiKey = this.config.get<string>("NIKITA_OTP_API_KEY")?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException("Отправка SMS пока не настроена");
    }

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
      console.error("Nikita OTP returned an invalid response", {
        path,
        httpStatus: response.status,
      });
      throw new ServiceUnavailableException("Сервис SMS временно недоступен");
    }
    return result;
  }

  private throwProviderError(result: NikitaOtpResponse, fallback: string): never {
    console.error("Nikita OTP rejected request", {
      providerStatus: result.status,
      providerDescription: result.description,
    });
    const status = String(result.status ?? "");
    if (status === "4") {
      throw new ServiceUnavailableException("Отправка SMS временно недоступна");
    }
    if (status === "7") {
      throw new ServiceUnavailableException("Проверьте номер телефона");
    }
    throw new ServiceUnavailableException(fallback);
  }
}
