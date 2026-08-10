import {
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { MoreThan, Repository } from "typeorm";
import { OrderStatus } from "../orders/order.enums";
import { AuthorizedPhone } from "./authorized-phone.entity";
import { CaptchaVerificationService } from "./captcha-verification.service";
import { DevicePushToken } from "./device-push-token.entity";
import { NikitaOtpService } from "./nikita-otp.service";
import { PhoneAccount } from "./phone-account.entity";
import { PhoneAuthChallenge } from "./phone-auth.entity";
import type { RegisterPushTokenDto } from "./phone-auth.dto";

const CODE_TTL_MS = 5 * 60_000;
const ACCOUNT_SESSION_TTL_MS = 30 * 24 * 60 * 60_000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_PHONE_PER_HOUR = 5;
const MAX_SENDS_PER_IP_PER_HOUR = 20;

export function smsResendDelaySeconds(sendNumber: number) {
  if (sendNumber <= 1) return 60;
  if (sendNumber === 2) return 5 * 60;
  if (sendNumber === 3) return 60 * 60;
  return 24 * 60 * 60;
}

@Injectable()
export class PhoneAuthService {
  constructor(
    @InjectRepository(PhoneAuthChallenge)
    private readonly challenges: Repository<PhoneAuthChallenge>,
    @InjectRepository(AuthorizedPhone)
    private readonly authorizedPhones: Repository<AuthorizedPhone>,
    @InjectRepository(PhoneAccount)
    private readonly accounts: Repository<PhoneAccount>,
    @InjectRepository(DevicePushToken)
    private readonly pushTokens: Repository<DevicePushToken>,
    private readonly captcha: CaptchaVerificationService,
    private readonly config: ConfigService,
    private readonly otp: NikitaOtpService,
  ) {}

  async requestCode(phone: string, captchaToken: string, remoteIp: string) {
    await this.captcha.verify(captchaToken, remoteIp);
    this.hash("configuration-check");
    const ipHash = this.hash(`request-ip:${remoteIp || "unknown"}`);

    return this.challenges.manager.transaction(async (manager) => {
      await manager.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [`sms:${phone}`],
      );
      const challenges = manager.getRepository(PhoneAuthChallenge);
      const authorizedPhones = manager.getRepository(AuthorizedPhone);
      if (await authorizedPhones.existsBy({ phone, enabled: true })) {
        return this.issueTrustedVerification(phone);
      }

      const now = new Date();
      await this.assertRequestAllowed(challenges, phone, ipHash, now);
      const sendsInLastDay = await challenges.count({
        where: {
          phone,
          channel: "sms",
          createdAt: MoreThan(new Date(now.getTime() - 24 * 60 * 60_000)),
        },
      });
      const retryAfterSeconds = smsResendDelaySeconds(sendsInLastDay + 1);
      const providerToken = await this.otp.send(phone, randomBytes(16).toString("hex"));
      await challenges.save(challenges.create({
        id: randomUUID(),
        phone,
        channel: "sms",
        providerToken,
        requestIpHash: ipHash,
        attemptCount: 0,
        expiresAt: new Date(now.getTime() + CODE_TTL_MS),
        nextSendAt: new Date(now.getTime() + retryAfterSeconds * 1_000),
        verifiedAt: null,
        consumedAt: null,
      }));
      return {
        expiresInSeconds: CODE_TTL_MS / 1_000,
        retryAfterSeconds,
      };
    });
  }

  async verifyCode(phone: string, code: string) {
    const now = new Date();
    const challenge = await this.challenges.createQueryBuilder("challenge")
      .where("challenge.phone = :phone", { phone })
      .andWhere("challenge.channel = :channel", { channel: "sms" })
      .andWhere("challenge.verifiedAt IS NULL")
      .andWhere("challenge.consumedAt IS NULL")
      .andWhere("challenge.expiresAt > :now", { now })
      .orderBy("challenge.createdAt", "DESC")
      .getOne();
    if (!challenge) throw new UnauthorizedException("Код истёк. Запросите новый");
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
    return { phone, ...(await this.issueAccountSession(phone)) };
  }

  async profile(phone: string, verificationToken: string) {
    const account = await this.requireAccount(phone, verificationToken);
    const orders = await this.challenges.manager.query(`
      SELECT "id", "total", "status", "deliveryType", "createdAt", "address"
      FROM "orders" WHERE "phone" = $1 ORDER BY "createdAt" DESC LIMIT 30
    `, [phone]) as Array<{
      id: string;
      total: number;
      status: OrderStatus;
      deliveryType: string;
      createdAt: Date;
      address: string;
    }>;
    const activeStatuses = new Set<OrderStatus>([
      OrderStatus.NEW,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.DELIVERING,
    ]);
    return {
      naktaCoins: account.naktaCoins,
      naktaCoinTransactions: [],
      currentOrders: orders.filter((order) => activeStatuses.has(order.status)),
      orderHistory: orders.filter((order) => !activeStatuses.has(order.status)),
    };
  }

  async orderDetails(phone: string, verificationToken: string, id: string) {
    await this.requireAccount(phone, verificationToken);
    const [order] = await this.challenges.manager.query(`
      SELECT "id", "total", "subtotal", "status", "deliveryType", "createdAt", "address",
        "apartment", "entrance", "floor", "intercom", "comment", "utensilsCount", "noUtensils", "paymentMethod"
      FROM "orders" WHERE "phone" = $1 AND "id" = $2 LIMIT 1
    `, [phone, id]) as Array<Record<string, unknown>>;
    if (!order) throw new NotFoundException("Заказ не найден");
    const items = await this.challenges.manager.query(`
      SELECT "productName", "quantity", "lineTotal", "modifierSnapshots"
      FROM "order_items" WHERE "orderId" = $1 ORDER BY "id" ASC
    `, [id]) as Array<Record<string, unknown>>;
    return { ...order, items };
  }

  async deleteAccount(phone: string, verificationToken: string) {
    await this.requireAccount(phone, verificationToken);
    await this.accounts.manager.transaction(async (manager) => {
      await manager.query(`DELETE FROM "device_push_tokens" WHERE "phone" = $1`, [phone]);
      await manager.query(`DELETE FROM "phone_auth_challenges" WHERE "phone" = $1`, [phone]);
      await manager.query(`DELETE FROM "phone_accounts" WHERE "phone" = $1`, [phone]);
    });
    return { deleted: true };
  }

  async registerPushToken(dto: RegisterPushTokenDto) {
    const existing = await this.pushTokens.findOne({
      where: [{ deviceId: dto.deviceId }, { expoPushToken: dto.expoPushToken }],
    });
    const entity = existing ?? this.pushTokens.create();
    Object.assign(entity, dto, { enabled: true, lastSeenAt: new Date() });
    await this.pushTokens.save(entity);
    return { deviceId: dto.deviceId, registered: true };
  }

  async removePushToken(phone: string, deviceId: string) {
    const result = await this.pushTokens.delete({ phone, deviceId });
    return { removed: Boolean(result.affected) };
  }

  assertAccount(phone: string, verificationToken: string) {
    return this.requireAccount(phone, verificationToken);
  }

  private async assertRequestAllowed(
    repository: Repository<PhoneAuthChallenge>,
    phone: string,
    ipHash: string,
    now: Date,
  ) {
    const latest = await repository.findOne({
      where: { phone, channel: "sms" },
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
    const phoneCount = await repository.count({
      where: { phone, channel: "sms", createdAt: MoreThan(hourAgo) },
    });
    if (phoneCount >= MAX_SENDS_PER_PHONE_PER_HOUR) {
      throw new HttpException({ message: "Слишком много запросов. Попробуйте через час" }, 429);
    }
    const ipCount = await repository.count({
      where: { requestIpHash: ipHash, channel: "sms", createdAt: MoreThan(hourAgo) },
    });
    if (ipCount >= MAX_SENDS_PER_IP_PER_HOUR) {
      throw new HttpException({ message: "Слишком много запросов с этого устройства. Попробуйте позже" }, 429);
    }
  }

  private async issueTrustedVerification(phone: string) {
    const now = new Date();
    await this.challenges.save(this.challenges.create({
      id: randomUUID(),
      phone,
      channel: "trusted",
      providerToken: "authorized-phone",
      requestIpHash: null,
      attemptCount: 0,
      expiresAt: new Date(now.getTime() + CODE_TTL_MS),
      nextSendAt: now,
      verifiedAt: now,
      consumedAt: null,
    }));
    return { verified: true as const, phone, ...(await this.issueAccountSession(phone)) };
  }

  private async issueAccountSession(phone: string) {
    const now = new Date();
    const verificationToken = randomBytes(32).toString("hex");
    const account = await this.accounts.findOneBy({ phone }) ?? this.accounts.create({ phone });
    account.sessionTokenHash = this.hash(verificationToken);
    account.sessionExpiresAt = new Date(now.getTime() + ACCOUNT_SESSION_TTL_MS);
    await this.accounts.save(account);
    return { verificationToken, expiresInSeconds: ACCOUNT_SESSION_TTL_MS / 1_000 };
  }

  private async requireAccount(phone: string, verificationToken: string) {
    const account = await this.accounts.findOne({
      where: {
        phone,
        sessionTokenHash: this.hash(verificationToken),
        sessionExpiresAt: MoreThan(new Date()),
      },
    });
    if (!account) throw new UnauthorizedException("Войдите в профиль ещё раз");
    return account;
  }

  private hash(value: string) {
    const secret = this.config.get<string>("OTP_HASH_SECRET");
    if (!secret || secret.length < 32) {
      throw new ServiceUnavailableException("Авторизация пока не настроена");
    }
    return createHmac("sha256", secret).update(value).digest("hex");
  }
}
