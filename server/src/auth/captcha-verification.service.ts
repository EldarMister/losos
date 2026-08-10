import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type TurnstileResponse = {
  action?: string;
  hostname?: string;
  success?: boolean;
  "error-codes"?: string[];
};

@Injectable()
export class CaptchaVerificationService {
  constructor(private readonly config: ConfigService) {}

  async verify(token: string, remoteIp: string) {
    const secret = this.config.get<string>("TURNSTILE_SECRET_KEY")?.trim();
    if (!secret) {
      throw new ServiceUnavailableException("Проверка безопасности пока не настроена");
    }

    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    let response: Response;
    try {
      response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      console.error("Turnstile verification request failed", { error });
      throw new ServiceUnavailableException("Проверка безопасности временно недоступна");
    }

    const result = await response.json().catch(() => null) as TurnstileResponse | null;
    if (!response.ok || !result) {
      throw new ServiceUnavailableException("Проверка безопасности временно недоступна");
    }
    const expectedHostname = this.config.get<string>("TURNSTILE_EXPECTED_HOSTNAME")?.trim();
    const hostnameMatches = !expectedHostname || result.hostname === expectedHostname;
    if (!result.success || result.action !== "login_sms" || !hostnameMatches) {
      console.warn("Turnstile rejected auth request", {
        action: result.action,
        hostname: result.hostname,
        errorCodes: result["error-codes"],
      });
      throw new UnauthorizedException("Проверка безопасности не пройдена. Попробуйте ещё раз");
    }
  }
}
