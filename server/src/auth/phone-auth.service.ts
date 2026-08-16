import {
  HttpException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { LessThan, MoreThan, Repository } from "typeorm";
import { OrderStatus } from "../orders/order.enums";
import { AuthorizedPhone } from "./authorized-phone.entity";
import { CaptchaVerificationService } from "./captcha-verification.service";
import { DevicePushToken } from "./device-push-token.entity";
import { NikitaOtpService } from "./nikita-otp.service";
import { PhoneAccount } from "./phone-account.entity";
import { PhoneAuthChallenge } from "./phone-auth.entity";
import type { RegisterPushTokenDto } from "./phone-auth.dto";
import { AccountNft } from "../rewards/account-nft.entity";
import { NaktaCoinTransaction } from "../rewards/nakta-coin-transaction.entity";
import { NaktaCoinWithdrawal } from "../rewards/nakta-coin-withdrawal.entity";
import { AccountSession } from "./account-session.entity";

const CODE_TTL_MS = 5 * 60_000;
const ACCOUNT_SESSION_TTL_MS = 30 * 24 * 60 * 60_000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_PHONE_PER_HOUR = 5;
const MAX_SENDS_PER_IP_PER_HOUR = 20;

export function isWalletAddressValid(network: string, address: string) {
  if (["polygon", "ethereum", "bsc"].includes(network)) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  if (network === "solana") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  if (network === "ton") return /^(?:-1|0):[a-fA-F0-9]{64}$/.test(address)
    || /^(?:EQ|UQ)[A-Za-z0-9_-]{46}$/.test(address);
  return false;
}

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
    @InjectRepository(AccountNft)
    private readonly nfts: Repository<AccountNft>,
    @InjectRepository(NaktaCoinTransaction)
    private readonly coinTransactions: Repository<NaktaCoinTransaction>,
    @InjectRepository(AccountSession)
    private readonly sessions: Repository<AccountSession>,
    @InjectRepository(NaktaCoinWithdrawal)
    private readonly coinWithdrawals: Repository<NaktaCoinWithdrawal>,
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
    const [naktaCoinHistory, nfts, naktaCoinWithdrawals] = await Promise.all([
      this.coinTransactions.find({
        where: { phone },
        order: { createdAt: "DESC" },
        take: 100,
      }),
      this.nfts.find({
        where: { phone },
        order: { createdAt: "DESC" },
        take: 200,
      }),
      this.coinWithdrawals.find({
        where: { phone },
        order: { createdAt: "DESC" },
        take: 20,
      }),
    ]);
    const coinWithdrawalIds = new Set(naktaCoinWithdrawals.map((withdrawal) => withdrawal.id));
    return {
      naktaCoins: account.naktaCoins,
      naktaCoinHistory: naktaCoinHistory.map((entry) => ({
        id: entry.id,
        amount: entry.amount,
        createdAt: entry.createdAt,
        description: entry.description,
        orderId: coinWithdrawalIds.has(entry.orderId) ? undefined : entry.orderId,
      })),
      nfts: nfts.map((nft) => this.publicNft(nft)),
      naktaCoinWithdrawals,
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

  async cancelOrder(phone: string, verificationToken: string, id: string) {
    await this.requireAccount(phone, verificationToken);
    return this.accounts.manager.transaction(async (manager) => {
      const [order] = await manager.query(`
        SELECT "id", "status"
        FROM "orders"
        WHERE "phone" = $1 AND "id" = $2
        FOR UPDATE
      `, [phone, id]) as Array<{ id: string; status: OrderStatus }>;
      if (!order) throw new NotFoundException("Заказ не найден");
      if (order.status === OrderStatus.CANCELLED) {
        return { id: order.id, status: OrderStatus.CANCELLED };
      }
      if (order.status !== OrderStatus.NEW) {
        throw new ConflictException("Заказ уже подтверждён и не может быть отменён");
      }
      await manager.query(`
        UPDATE "orders"
        SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "phone" = $2 AND "id" = $3
      `, [OrderStatus.CANCELLED, phone, id]);
      return { id: order.id, status: OrderStatus.CANCELLED };
    });
  }

  async deleteAccount(phone: string, verificationToken: string) {
    await this.requireAccount(phone, verificationToken);
    await this.accounts.manager.transaction(async (manager) => {
      await manager.query(`DELETE FROM "account_sessions" WHERE "phone" = $1`, [phone]);
      await manager.query(`DELETE FROM "device_push_tokens" WHERE "phone" = $1`, [phone]);
      await manager.query(`DELETE FROM "phone_auth_challenges" WHERE "phone" = $1`, [phone]);
      await manager.query(`DELETE FROM "nakta_coin_transactions" WHERE "phone" = $1`, [phone]);
      await manager.query(`DELETE FROM "account_nfts" WHERE "phone" = $1`, [phone]);
      await manager.query(`DELETE FROM "nakta_coin_withdrawals" WHERE "phone" = $1`, [phone]);
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

  async withdrawNft(
    phone: string,
    verificationToken: string,
    nftId: string,
    walletAddress: string,
  ) {
    await this.requireAccount(phone, verificationToken);
    const nft = await this.nfts.manager.transaction(async (manager) => {
      const repository = manager.getRepository(AccountNft);
      const owned = await repository.findOne({
        where: { id: nftId, phone },
        lock: { mode: "pessimistic_write" },
      });
      if (!owned) throw new NotFoundException("NFT не найден");
      if (["pending", "submitted"].includes(owned.status)) {
        throw new ConflictException("Вывод этого NFT уже обрабатывается");
      }
      if (owned.status === "withdrawn") {
        throw new ConflictException("Этот NFT уже выведен");
      }
      if (!isWalletAddressValid(owned.network, walletAddress)) {
        throw new BadRequestException(`Некорректный адрес кошелька для сети ${owned.network}`);
      }
      owned.status = "pending";
      owned.walletAddress = walletAddress;
      owned.withdrawalRequestedAt = new Date();
      owned.withdrawalError = null;
      return repository.save(owned);
    });

    return this.dispatchNftWithdrawal(nft);
  }

  async withdrawNaktaCoins(
    phone: string,
    verificationToken: string,
    walletAddress: string,
    amount: number,
  ) {
    await this.requireAccount(phone, verificationToken);
    return this.accounts.manager.transaction(async (manager) => {
      const accountRepository = manager.getRepository(PhoneAccount);
      const account = await accountRepository.findOne({
        where: { phone },
        lock: { mode: "pessimistic_write" },
      });
      if (!account) throw new NotFoundException("Аккаунт не найден");
      if (account.naktaCoins <= 0 || amount > account.naktaCoins) {
        throw new BadRequestException("Недостаточно NAKTA Coin для вывода");
      }

      const withdrawalRepository = manager.getRepository(NaktaCoinWithdrawal);
      const withdrawal = await withdrawalRepository.save(withdrawalRepository.create({
        phone,
        amount,
        walletAddress,
        status: "pending",
        txHash: null,
        error: null,
        processedAt: null,
      }));

      account.naktaCoins -= amount;
      await accountRepository.save(account);
      await manager.getRepository(NaktaCoinTransaction).save({
        phone,
        orderId: withdrawal.id,
        amount: -amount,
        description: "Заявка на вывод NAKTA Coin",
      });
      return withdrawal;
    });
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
    const tokenHash = this.hash(verificationToken);
    const expiresAt = new Date(now.getTime() + ACCOUNT_SESSION_TTL_MS);
    const account = await this.accounts.findOneBy({ phone }) ?? this.accounts.create({ phone });
    account.sessionTokenHash = tokenHash;
    account.sessionExpiresAt = expiresAt;
    await this.accounts.save(account);
    await this.sessions.delete({ phone, expiresAt: LessThan(now) });
    await this.sessions.save(this.sessions.create({
      id: randomUUID(),
      phone,
      tokenHash,
      expiresAt,
    }));
    return { verificationToken, expiresInSeconds: ACCOUNT_SESSION_TTL_MS / 1_000 };
  }

  private async requireAccount(phone: string, verificationToken: string) {
    const now = new Date();
    const tokenHash = this.hash(verificationToken);
    const account = await this.accounts.findOneBy({ phone });
    if (!account) throw new UnauthorizedException("Войдите в профиль ещё раз");
    const legacySessionValid = account.sessionTokenHash === tokenHash
      && Boolean(account.sessionExpiresAt && account.sessionExpiresAt > now);
    const deviceSessionValid = legacySessionValid || await this.sessions.exists({
      where: { phone, tokenHash, expiresAt: MoreThan(now) },
    });
    if (!deviceSessionValid) throw new UnauthorizedException("Войдите в профиль ещё раз");
    return account;
  }

  private publicNft(nft: AccountNft) {
    return {
      id: nft.id,
      name: nft.name,
      image: nft.image,
      description: nft.description,
      network: nft.network,
      contractAddress: nft.contractAddress,
      tokenId: nft.tokenId,
      status: nft.status,
      walletAddress: nft.walletAddress,
      txHash: nft.txHash,
      withdrawalError: nft.withdrawalError,
      createdAt: nft.createdAt,
      withdrawnAt: nft.withdrawnAt,
      orderId: nft.orderId,
      milestoneOrderCount: nft.milestoneOrderCount,
    };
  }

  private async dispatchNftWithdrawal(nft: AccountNft) {
    const url = this.config.get<string>("NFT_TRANSFER_WEBHOOK_URL")?.trim();
    if (!url) return this.publicNft(nft);

    try {
      const token = this.config.get<string>("NFT_TRANSFER_WEBHOOK_TOKEN")?.trim();
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          withdrawalId: nft.id,
          walletAddress: nft.walletAddress,
          network: nft.network,
          contractAddress: nft.contractAddress || undefined,
          metadataUri: nft.metadataUri || undefined,
          name: nft.name,
          description: nft.description,
          image: nft.image,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`provider returned ${response.status}`);
      const result = await response.json() as {
        status?: "submitted" | "withdrawn";
        txHash?: string;
        tokenId?: string;
      };
      if (!result.txHash) throw new Error("provider did not return txHash");
      nft.status = result.status === "withdrawn" ? "withdrawn" : "submitted";
      nft.txHash = result.txHash?.slice(0, 200) || null;
      nft.tokenId = result.tokenId?.slice(0, 160) || null;
      nft.withdrawnAt = nft.status === "withdrawn" ? new Date() : null;
      return this.publicNft(await this.nfts.save(nft));
    } catch (error) {
      nft.status = "failed";
      nft.withdrawalError = "Не удалось отправить NFT. Проверьте адрес и повторите попытку.";
      console.error("NFT withdrawal provider failed", {
        nftId: nft.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return this.publicNft(await this.nfts.save(nft));
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
