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
  IsNull,
  MoreThan,
  Not,
  Repository,
} from "typeorm";
import { NikitaOtpService } from "./nikita-otp.service";
import { PhoneAuthChallenge } from "./phone-auth.entity";

const CODE_TTL_MS = 5 * 60_000;
const TOKEN_TTL_MS = 30 * 60_000;
const RESEND_DELAY_MS = 60_000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 5;

@Injectable()
export class PhoneAuthService {
  constructor(
    @InjectRepository(PhoneAuthChallenge)
    private readonly challenges: Repository<PhoneAuthChallenge>,
    private readonly config: ConfigService,
    private readonly otp: NikitaOtpService,
  ) {}

  async requestCode(phone: string) {
    this.hash("configuration-check");
    const now = new Date();
    const latest = await this.challenges.findOne({
      where: { phone },
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
      where: { phone, createdAt: MoreThan(hourAgo) },
    });
    if (recentCount >= MAX_SENDS_PER_HOUR) {
      throw new HttpException(
        { message: "Слишком много запросов. Попробуйте через час" },
        429,
      );
    }

    const id = randomUUID();
    const transactionId = randomBytes(16).toString("hex");
    const providerToken = await this.otp.send(phone, transactionId);

    await this.challenges.save(this.challenges.create({
      id,
      phone,
      providerToken,
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

  async verifyCode(phone: string, code: string) {
    const now = new Date();
    const challenge = await this.challenges.findOne({
      where: {
        phone,
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

    const verificationToken = randomBytes(32).toString("hex");
    challenge.verifiedAt = now;
    challenge.verificationTokenHash = this.hash(verificationToken);
    challenge.verificationTokenExpiresAt = new Date(now.getTime() + TOKEN_TTL_MS);
    await this.challenges.save(challenge);

    return {
      verificationToken,
      phone,
      expiresInSeconds: TOKEN_TTL_MS / 1_000,
    };
  }

  async consumeVerification(phone: string, verificationToken: string, manager: EntityManager) {
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

  private hash(value: string) {
    const secret = this.config.get<string>("OTP_HASH_SECRET");
    if (!secret || secret.length < 32) {
      throw new ServiceUnavailableException("Авторизация пока не настроена");
    }
    return createHmac("sha256", secret).update(value).digest("hex");
  }
}
