import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import {
  createHmac,
  randomBytes,
  randomUUID,
} from "node:crypto";
import {
  EntityManager,
  MoreThan,
  Not,
  IsNull,
  Repository,
} from "typeorm";
import { NikitaOtpService } from "./nikita-otp.service";
import { AuthorizedPhone } from "./authorized-phone.entity";
import { PhoneAccount } from "./phone-account.entity";
import { PhoneAuthChallenge } from "./phone-auth.entity";
import { WhatsappCloudService } from "./whatsapp-cloud.service";

const CODE_TTL_MS = 5 * 60_000;
const WHATSAPP_CODE_TTL_MS = 10 * 60_000;
const TOKEN_TTL_MS = 30 * 60_000;
const ACCOUNT_SESSION_TTL_MS = 30 * 24 * 60 * 60_000;
const RESEND_DELAY_MS = 60_000;
const WHATSAPP_RESEND_DELAY_MS = 20_000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 5;
const WHATSAPP_CODE_PATTERN = /NAKTA-[A-F0-9]{48}/i;

export type WhatsappWebhookPayload = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: {
        metadata?: { phone_number_id?: string };
        messages?: Array<{
          from?: string;
          type?: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
};

export const extractWhatsappAuthCode = (message: string) =>
  message.match(WHATSAPP_CODE_PATTERN)?.[0].toUpperCase() ?? null;

@Injectable()
export class PhoneAuthService {
  constructor(
    @InjectRepository(PhoneAuthChallenge)
    private readonly challenges: Repository<PhoneAuthChallenge>,
    private readonly config: ConfigService,
    private readonly otp: NikitaOtpService,
    private readonly whatsapp: WhatsappCloudService,
    @InjectRepository(AuthorizedPhone)
    private readonly authorizedPhones: Repository<AuthorizedPhone>,
    @InjectRepository(PhoneAccount)
    private readonly accounts: Repository<PhoneAccount>,
  ) {}

  async requestCode(phone: string) {
    this.hash("configuration-check");
    if (await this.authorizedPhones.existsBy({ phone, enabled: true })) {
      return this.issueTrustedVerification(phone);
    }
    const now = new Date();
    await this.assertRequestAllowed(phone, "sms", now);

    const id = randomUUID();
    const transactionId = randomBytes(16).toString("hex");
    const providerToken = await this.otp.send(phone, transactionId);

    await this.challenges.save(this.challenges.create({
      id,
      phone,
      channel: "sms",
      providerToken,
      pollTokenHash: null,
      attemptCount: 0,
      expiresAt: new Date(now.getTime() + CODE_TTL_MS),
      nextSendAt: new Date(now.getTime() + RESEND_DELAY_MS),
      verifiedAt: null,
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
      consumedAt: null,
    }));

    return { expiresInSeconds: CODE_TTL_MS / 1_000, retryAfterSeconds: RESEND_DELAY_MS / 1_000 };
  }

  async requestWhatsapp(phone: string) {
    this.hash("configuration-check");
    const now = new Date();
    await this.assertRequestAllowed(phone, "whatsapp", now);

    const id = randomUUID();
    const code = `NAKTA-${randomBytes(24).toString("hex").toUpperCase()}`;
    const pollToken = randomBytes(32).toString("hex");
    const whatsappUrl = this.whatsapp.createAuthUrl(code);
    const expiresAt = new Date(now.getTime() + WHATSAPP_CODE_TTL_MS);
    await this.challenges.save(this.challenges.create({
      id,
      phone,
      channel: "whatsapp",
      providerToken: this.hash(`whatsapp-code:${code}`),
      pollTokenHash: this.hash(`whatsapp-poll:${pollToken}`),
      attemptCount: 0,
      expiresAt,
      nextSendAt: new Date(now.getTime() + WHATSAPP_RESEND_DELAY_MS),
      verifiedAt: null,
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
      consumedAt: null,
    }));

    return {
      challengeId: id,
      pollToken,
      phone,
      whatsappUrl,
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds: WHATSAPP_CODE_TTL_MS / 1_000,
      retryAfterSeconds: WHATSAPP_RESEND_DELAY_MS / 1_000,
    };
  }

  async checkWhatsapp(challengeId: string, pollToken: string) {
    const challenge = await this.challenges.findOne({
      where: {
        id: challengeId,
        channel: "whatsapp",
        pollTokenHash: this.hash(`whatsapp-poll:${pollToken}`),
      },
    });
    if (!challenge) {
      throw new UnauthorizedException("Запрос подтверждения не найден");
    }

    const now = new Date();
    if (!challenge.verifiedAt) {
      if (challenge.expiresAt <= now) {
        return { status: "expired" as const };
      }
      return {
        status: "pending" as const,
        expiresAt: challenge.expiresAt.toISOString(),
      };
    }
    if (challenge.expiresAt <= now || challenge.consumedAt) {
      return { status: "expired" as const };
    }

    const session = await this.issueAccountSession(challenge.phone);
    return {
      status: "verified" as const,
      phone: challenge.phone,
      ...session,
    };
  }

  async handleWhatsappWebhook(payload: WhatsappWebhookPayload) {
    if (payload.object !== "whatsapp_business_account") return;

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (
          change.field !== "messages"
          || !this.whatsapp.acceptsPhoneNumberId(value?.metadata?.phone_number_id)
        ) {
          continue;
        }
        for (const message of value?.messages ?? []) {
          const from = message.from?.replace(/\D/g, "");
          const body = message.type === "text" ? message.text?.body?.trim() : "";
          if (!from || !body) continue;
          const reply = await this.confirmWhatsappMessage(`+${from}`, body);
          await this.whatsapp.sendText(from, reply);
        }
      }
    }
  }

  async verifyCode(phone: string, code: string) {
    const now = new Date();
    const challenge = await this.challenges.findOne({
      where: {
        phone,
        channel: "sms",
        verifiedAt: IsNull(),
        consumedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
      order: { createdAt: "DESC" },
    });
    if (!challenge) {
      throw new UnauthorizedException("Код истёк. Запросите новый");
    }
    if (challenge.attemptCount >= MAX_ATTEMPTS) {
      throw new UnauthorizedException("Слишком много попыток. Запросите новый код");
    }

    const verification = await this.otp.verify(challenge.providerToken, code);
    if (!verification.valid) {
      if (verification.status === "13" || verification.status === "12") {
        throw new UnauthorizedException("Код истёк. Запросите новый");
      }
      if (verification.status !== "14") {
        console.error("Nikita OTP verification failed", {
          providerStatus: verification.status,
          providerDescription: verification.description,
        });
        throw new ServiceUnavailableException("Не удалось проверить код. Попробуйте позже");
      }
      challenge.attemptCount += 1;
      await this.challenges.save(challenge);
      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - challenge.attemptCount);
      throw new UnauthorizedException(
        attemptsLeft > 0
          ? `Неверный код. Осталось попыток: ${attemptsLeft}`
          : "Слишком много попыток. Запросите новый код",
      );
    }

    challenge.verifiedAt = now;
    await this.challenges.save(challenge);

    return {
      phone,
      ...(await this.issueAccountSession(phone)),
    };
  }

  async consumeVerification(phone: string, verificationToken: string, manager: EntityManager) {
    const accounts = manager.getRepository(PhoneAccount);
    const account = await accounts.findOne({
      where: {
        phone,
        sessionTokenHash: this.hash(verificationToken),
        sessionExpiresAt: MoreThan(new Date()),
      },
    });
    if (account) return;

    const repository = manager.getRepository(PhoneAuthChallenge);
    const challenge = await repository.findOne({
      where: {
        phone,
        verificationTokenHash: this.hash(verificationToken),
        verifiedAt: Not(IsNull()),
        verificationTokenExpiresAt: MoreThan(new Date()),
        consumedAt: IsNull(),
      },
    });
    if (!challenge) {
      throw new UnauthorizedException("Подтвердите номер телефона ещё раз");
    }
    challenge.consumedAt = new Date();
    await repository.save(challenge);
  }

  private async confirmWhatsappMessage(senderPhone: string, message: string) {
    const code = extractWhatsappAuthCode(message);
    if (!code) {
      return "Чтобы подтвердить номер, вернитесь на сайт NAKTA SUSHI и нажмите «Подтвердить через WhatsApp».";
    }
    const challenge = await this.challenges.findOne({
      where: {
        channel: "whatsapp",
        providerToken: this.hash(`whatsapp-code:${code}`),
        consumedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: "DESC" },
    });
    if (!challenge) {
      return "Код не найден или уже истёк. Вернитесь на сайт и запросите новый код.";
    }
    if (challenge.phone !== senderPhone) {
      return "Этот код создан для другого номера телефона. Введите на сайте номер, с которого вы пишете в WhatsApp.";
    }
    if (challenge.verifiedAt) {
      return "✅ Ваш номер уже подтверждён. Вернитесь на сайт — вход завершится автоматически.";
    }

    const now = new Date();
    challenge.verifiedAt = now;
    await this.challenges.save(challenge);
    return "✅ Ваш номер подтверждён. Вернитесь на сайт — вход завершится автоматически.";
  }

  private async issueTrustedVerification(phone: string) {
    const now = new Date();
    await this.challenges.save(this.challenges.create({
      id: randomUUID(),
      phone,
      channel: "trusted",
      providerToken: "authorized-phone",
      pollTokenHash: null,
      attemptCount: 0,
      expiresAt: new Date(now.getTime() + TOKEN_TTL_MS),
      nextSendAt: now,
      verifiedAt: now,
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
      consumedAt: null,
    }));
    return {
      verified: true as const,
      phone,
      ...(await this.issueAccountSession(phone)),
    };
  }

  private async issueAccountSession(phone: string) {
    const now = new Date();
    const verificationToken = randomBytes(32).toString("hex");
    const account = await this.accounts.findOneBy({ phone }) ?? this.accounts.create({ phone });
    account.sessionTokenHash = this.hash(verificationToken);
    account.sessionExpiresAt = new Date(now.getTime() + ACCOUNT_SESSION_TTL_MS);
    await this.accounts.save(account);
    return {
      verificationToken,
      expiresInSeconds: ACCOUNT_SESSION_TTL_MS / 1_000,
    };
  }

  private async assertRequestAllowed(
    phone: string,
    channel: "sms" | "whatsapp",
    now: Date,
  ) {
    const latest = await this.challenges.findOne({
      where: { phone, channel },
      order: { createdAt: "DESC" },
    });
    if (latest && latest.nextSendAt > now) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((latest.nextSendAt.getTime() - now.getTime()) / 1_000),
      );
      throw new HttpException(
        { message: `Повторный код можно запросить через ${retryAfterSeconds} сек.`, retryAfterSeconds },
        429,
      );
    }

    const hourAgo = new Date(now.getTime() - 60 * 60_000);
    const recentCount = await this.challenges.count({
      where: { phone, channel, createdAt: MoreThan(hourAgo) },
    });
    if (recentCount >= MAX_SENDS_PER_HOUR) {
      throw new HttpException(
        { message: "Слишком много запросов. Попробуйте через час" },
        429,
      );
    }
  }

  private hash(value: string) {
    const secret = this.config.get<string>("OTP_HASH_SECRET");
    if (!secret || secret.length < 32) {
      throw new ServiceUnavailableException("Авторизация пока не настроена");
    }
    return createHmac("sha256", secret).update(value).digest("hex");
  }
}
