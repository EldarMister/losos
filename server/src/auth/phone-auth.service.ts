import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
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
  LessThanOrEqual,
  MoreThan,
  Not,
  IsNull,
  Repository,
} from "typeorm";
import { NikitaOtpService } from "./nikita-otp.service";
import { AuthorizedPhone } from "./authorized-phone.entity";
import { PhoneAccount } from "./phone-account.entity";
import { PhoneAccountSession } from "./phone-account-session.entity";
import { OrderStatus } from "../orders/order.enums";
import { PhoneAuthChallenge } from "./phone-auth.entity";
import { WhatsappCloudService } from "./whatsapp-cloud.service";
import { CaptchaVerificationService } from "./captcha-verification.service";
import { AccountNft } from "../rewards/account-nft.entity";
import { NaktaCoinTransaction } from "../rewards/nakta-coin-transaction.entity";
import { NaktaCoinWithdrawal } from "../rewards/nakta-coin-withdrawal.entity";

const CODE_TTL_MS = 5 * 60_000;
const WHATSAPP_CODE_TTL_MS = 10 * 60_000;
const TOKEN_TTL_MS = 30 * 60_000;
const ACCOUNT_SESSION_TTL_MS = 30 * 24 * 60 * 60_000;
const WHATSAPP_RESEND_DELAY_MS = 20_000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 5;
const WHATSAPP_CODE_PATTERN = /NAKTA-[A-F0-9]{48}/i;

export function isWalletAddressValid(network: string, address: string) {
  if (["polygon", "ethereum", "bsc"].includes(network)) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  if (network === "solana") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  if (network === "ton") {
    return /^(?:-1|0):[a-fA-F0-9]{64}$/.test(address)
      || /^(?:EQ|UQ)[A-Za-z0-9_-]{46}$/.test(address);
  }
  return false;
}

export function smsResendDelaySeconds(sendNumber: number) {
  if (sendNumber <= 1) return 60;
  if (sendNumber === 2) return 5 * 60;
  if (sendNumber === 3) return 60 * 60;
  return 24 * 60 * 60;
}

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
    private readonly captcha: CaptchaVerificationService,
    @InjectRepository(AuthorizedPhone)
    private readonly authorizedPhones: Repository<AuthorizedPhone>,
    @InjectRepository(PhoneAccount)
    private readonly accounts: Repository<PhoneAccount>,
    @InjectRepository(PhoneAccountSession)
    private readonly sessions: Repository<PhoneAccountSession>,
    @InjectRepository(AccountNft)
    private readonly nfts: Repository<AccountNft>,
    @InjectRepository(NaktaCoinTransaction)
    private readonly coinTransactions: Repository<NaktaCoinTransaction>,
  ) {}

  async requestCode(phone: string, captchaToken: string, remoteIp: string) {
    await this.captcha.verify(captchaToken, remoteIp);
    this.hash("configuration-check");
    if (await this.authorizedPhones.existsBy({ phone, enabled: true })) {
      return this.issueTrustedVerification(phone);
    }
    const now = new Date();
    await this.assertRequestAllowed(phone, "sms", now);
    const sendsInLastDay = await this.challenges.count({
      where: {
        phone,
        channel: "sms",
        createdAt: MoreThan(new Date(now.getTime() - 24 * 60 * 60_000)),
      },
    });
    const retryAfterSeconds = smsResendDelaySeconds(sendsInLastDay + 1);

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
      nextSendAt: new Date(now.getTime() + retryAfterSeconds * 1_000),
      verifiedAt: null,
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
      consumedAt: null,
    }));

    return { expiresInSeconds: CODE_TTL_MS / 1_000, retryAfterSeconds };
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
    const sessions = manager.getRepository(PhoneAccountSession);
    const session = await sessions.findOne({
      where: {
        phone,
        tokenHash: this.hash(verificationToken),
        expiresAt: MoreThan(new Date()),
      },
    });
    if (session) return;

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

  async profile(phone: string, verificationToken: string) {
    const account = await this.requireAccount(phone, verificationToken);

    const orders = await this.challenges.manager.query(`
      SELECT "id", "orderNumber", "total", "status", "deliveryType", "createdAt", "address",
        "posStatus", "posSyncStatus", "posItemsTotal", "posItemsReady", "posItemsRejected"
      FROM "orders"
      WHERE "phone" = $1
      ORDER BY "createdAt" DESC
      LIMIT 30
    `, [phone]) as Array<{
      id: string;
      orderNumber: number;
      total: number;
      status: OrderStatus;
      deliveryType: string;
      createdAt: Date;
      address: string;
      posStatus: string | null;
      posSyncStatus: string;
      posItemsTotal: number;
      posItemsReady: number;
      posItemsRejected: number;
    }>;
    const currentStatuses = new Set<OrderStatus>([
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
      this.accounts.manager.getRepository(NaktaCoinWithdrawal).find({
        where: { phone },
        order: { createdAt: "DESC" },
        take: 20,
      }),
    ]);
    const withdrawalHistory = naktaCoinWithdrawals.flatMap((withdrawal) => {
      const reason = withdrawal.error?.trim() || null;
      const request = {
        id: `withdrawal-${withdrawal.id}`,
        amount: -withdrawal.amount,
        createdAt: withdrawal.createdAt,
        description: withdrawal.status === "withdrawn"
          ? "Вывод NAKTA Coin завершён"
          : withdrawal.status === "cancelled"
            ? "Заявка на вывод NAKTA Coin отменена"
            : withdrawal.status === "failed"
              ? "Заявка на вывод NAKTA Coin отклонена"
              : "Заявка на вывод NAKTA Coin",
        orderId: undefined,
        withdrawalId: withdrawal.id,
        withdrawalStatus: withdrawal.status,
        withdrawalReason: reason,
      };
      return ["failed", "cancelled"].includes(withdrawal.status)
        ? [request, {
          id: `withdrawal-refund-${withdrawal.id}`,
          amount: withdrawal.amount,
          createdAt: withdrawal.processedAt ?? withdrawal.createdAt,
          description: `${withdrawal.status === "cancelled"
            ? "Возврат NAKTA Coin после отмены вывода"
            : "Возврат NAKTA Coin после отклонения вывода"}${reason ? `. Причина: ${reason}` : ""}`,
          orderId: undefined,
          withdrawalId: withdrawal.id,
          withdrawalStatus: withdrawal.status,
          withdrawalReason: reason,
        }]
        : [request];
    });
    const serializedCoinHistory = [
      ...naktaCoinHistory.map((entry) => ({
        id: entry.id,
        amount: entry.amount,
        createdAt: entry.createdAt,
        description: entry.description,
        orderId: entry.orderId,
      })),
      ...withdrawalHistory,
    ].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    const serialize = (order: typeof orders[number]) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      deliveryType: order.deliveryType,
      createdAt: order.createdAt,
      address: order.address,
      posStatus: order.posStatus,
      posSyncStatus: order.posSyncStatus,
      posProgress: {
        itemsTotal: order.posItemsTotal,
        itemsReady: order.posItemsReady,
        itemsRejected: order.posItemsRejected,
      },
    });
    return {
      naktaCoins: account.naktaCoins,
      naktaCoinHistory: serializedCoinHistory,
      naktaCoinTransactions: serializedCoinHistory,
      nfts: nfts.map((nft) => this.publicNft(nft)),
      naktaCoinWithdrawals,
      currentOrders: orders.filter((order) => currentStatuses.has(order.status)).map(serialize),
      orderHistory: orders.filter((order) => !currentStatuses.has(order.status)).map(serialize),
    };
  }

  async orderDetails(phone: string, verificationToken: string, id: string) {
    await this.requireAccount(phone, verificationToken);
    const [order] = await this.challenges.manager.query(`
      SELECT "id", "orderNumber", "total", "subtotal", "status", "deliveryType", "createdAt", "address",
        "apartment", "entrance", "floor", "intercom", "comment", "utensilsCount", "noUtensils", "kitItems", "paymentMethod",
        "externalOrderId", "posOrderNumber", "posStatus", "posSyncStatus", "posItemsTotal", "posItemsReady", "posItemsRejected", "posLastSyncAt"
      FROM "orders"
      WHERE "phone" = $1 AND "id" = $2
      LIMIT 1
    `, [phone, id]) as Array<{
      id: string;
      orderNumber: number;
      total: number;
      subtotal: number;
      status: OrderStatus;
      deliveryType: string;
      createdAt: Date;
      address: string;
      apartment: string;
      entrance: string;
      floor: string;
      intercom: string;
      comment: string;
      utensilsCount: number;
      noUtensils: boolean;
      kitItems: unknown;
      paymentMethod: string;
      externalOrderId: string | null;
      posOrderNumber: string | null;
      posStatus: string | null;
      posSyncStatus: string;
      posItemsTotal: number;
      posItemsReady: number;
      posItemsRejected: number;
      posLastSyncAt: Date | null;
    }>;
    if (!order) throw new NotFoundException("Заказ не найден");

    const items = await this.challenges.manager.query(`
      SELECT "productName", "quantity", "lineTotal", "modifierSnapshots",
        "posStatus", "posReadyQuantity", "posRejectReason"
      FROM "order_items"
      WHERE "orderId" = $1
      ORDER BY "id" ASC
    `, [id]) as Array<{
      productName: string;
      quantity: number;
      lineTotal: number;
      modifierSnapshots: unknown;
      posStatus: string | null;
      posReadyQuantity: number;
      posRejectReason: string | null;
    }>;

    return {
      ...order,
      kitItems: Array.isArray(order.kitItems) ? order.kitItems : [],
      posProgress: {
        itemsTotal: order.posItemsTotal,
        itemsReady: order.posItemsReady,
        itemsRejected: order.posItemsRejected,
      },
      items: items.map((item) => ({
        ...item,
        modifierSnapshots: Array.isArray(item.modifierSnapshots) ? item.modifierSnapshots : [],
      })),
    };
  }

  async cancelOrder(phone: string, verificationToken: string, id: string) {
    await this.requireAccount(phone, verificationToken);
    return this.accounts.manager.transaction(async (manager) => {
      const [order] = await manager.query(`
        SELECT "id", "status", "posSyncStatus"
        FROM "orders"
        WHERE "phone" = $1 AND "id" = $2
        FOR UPDATE
      `, [phone, id]) as Array<{
        id: string;
        status: OrderStatus;
        posSyncStatus: string;
      }>;
      if (!order) throw new NotFoundException("Заказ не найден");
      if (order.status === OrderStatus.CANCELLED) {
        return { id: order.id, status: OrderStatus.CANCELLED };
      }
      if (order.status !== OrderStatus.NEW) {
        throw new ConflictException("Заказ уже подтверждён и не может быть отменён");
      }
      if (["submitting", "synced"].includes(order.posSyncStatus)) {
        throw new ConflictException("Заказ уже подтверждается и не может быть отменён");
      }
      await manager.query(`
        UPDATE "orders"
        SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "phone" = $2 AND "id" = $3
      `, [OrderStatus.CANCELLED, phone, id]);
      return { id: order.id, status: OrderStatus.CANCELLED };
    });
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
      owned.txHash = null;
      owned.tokenId = null;
      owned.withdrawnAt = null;
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
      if (amount < 1 || amount > account.naktaCoins) {
        throw new BadRequestException("Недостаточно NAKTA Coin для вывода");
      }

      const transactionRepository = manager.getRepository(NaktaCoinTransaction);
      const latestReward = await transactionRepository.findOne({
        where: { phone },
        order: { createdAt: "DESC" },
      });
      const regionSlug = latestReward?.regionSlug || "bishkek";
      const withdrawalRepository = manager.getRepository(NaktaCoinWithdrawal);
      const withdrawal = await withdrawalRepository.save(withdrawalRepository.create({
        phone,
        regionSlug,
        amount,
        walletAddress,
        status: "pending",
        txHash: null,
        error: null,
        processedAt: null,
      }));

      account.naktaCoins -= amount;
      await accountRepository.save(account);
      return withdrawal;
    });
  }

  async cancelNaktaCoinWithdrawal(
    phone: string,
    verificationToken: string,
    withdrawalId: string,
  ) {
    await this.requireAccount(phone, verificationToken);
    return this.accounts.manager.transaction(async (manager) => {
      const withdrawalRepository = manager.getRepository(NaktaCoinWithdrawal);
      const withdrawal = await withdrawalRepository.findOne({
        where: { id: withdrawalId, phone },
        lock: { mode: "pessimistic_write" },
      });
      if (!withdrawal) throw new NotFoundException("Заявка на вывод не найдена");
      if (withdrawal.status === "cancelled") return withdrawal;
      if (withdrawal.status !== "pending") {
        throw new ConflictException("Заявка уже обрабатывается и не может быть отменена");
      }

      const accountRepository = manager.getRepository(PhoneAccount);
      const account = await accountRepository.findOne({
        where: { phone },
        lock: { mode: "pessimistic_write" },
      });
      if (!account) throw new NotFoundException("Аккаунт не найден");

      withdrawal.status = "cancelled";
      withdrawal.error = "Отменено пользователем";
      withdrawal.processedAt = new Date();
      account.naktaCoins += withdrawal.amount;
      await accountRepository.save(account);
      return withdrawalRepository.save(withdrawal);
    });
  }

  async cancelNftWithdrawal(
    phone: string,
    verificationToken: string,
    nftId: string,
  ) {
    await this.requireAccount(phone, verificationToken);
    const nft = await this.nfts.manager.transaction(async (manager) => {
      const repository = manager.getRepository(AccountNft);
      const current = await repository.findOne({
        where: { id: nftId, phone },
        lock: { mode: "pessimistic_write" },
      });
      if (!current) throw new NotFoundException("NFT не найден");
      if (current.status !== "pending") {
        throw new ConflictException("Заявка уже обрабатывается и не может быть отменена");
      }

      current.status = "owned";
      current.walletAddress = null;
      current.txHash = null;
      current.tokenId = null;
      current.withdrawalError = "Заявка на вывод отменена пользователем";
      current.withdrawalRequestedAt = null;
      current.withdrawnAt = null;
      return repository.save(current);
    });
    return this.publicNft(nft);
  }

  async deleteAccount(phone: string, verificationToken: string) {
    await this.requireAccount(phone, verificationToken);
    await this.accounts.manager.transaction(async (manager) => {
      // Orders are part of the profile identity in this project. Removing them
      // prevents a later sign-in with the same number from restoring deleted data.
      await manager.query(`DELETE FROM "orders" WHERE "phone" = $1`, [phone]);
      await manager.query(`DELETE FROM "phone_auth_challenges" WHERE "phone" = $1`, [phone]);
      // Device push tokens are removed by the account foreign-key cascade.
      await manager.query(`DELETE FROM "phone_accounts" WHERE "phone" = $1`, [phone]);
    });
    return { deleted: true };
  }

  assertAccount(phone: string, verificationToken: string) {
    return this.requireAccount(phone, verificationToken);
  }

  private async requireAccount(phone: string, verificationToken: string) {
    const session = await this.sessions.findOne({
      where: {
        phone,
        tokenHash: this.hash(verificationToken),
        expiresAt: MoreThan(new Date()),
      },
    });
    if (!session) throw new UnauthorizedException("Войдите в профиль ещё раз");
    const account = await this.accounts.findOneBy({ phone });
    if (!account) throw new UnauthorizedException("Войдите в профиль ещё раз");
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
      withdrawalRequestedAt: nft.withdrawalRequestedAt,
      createdAt: nft.createdAt,
      withdrawnAt: nft.withdrawnAt,
      orderId: nft.orderId,
      regionSlug: nft.regionSlug,
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
      return this.settleNftWithdrawalAttempt(nft, (current) => {
        current.status = result.status === "withdrawn" ? "withdrawn" : "submitted";
        current.txHash = result.txHash!.slice(0, 200);
        current.tokenId = result.tokenId?.slice(0, 160) || null;
        current.withdrawalError = null;
        current.withdrawnAt = current.status === "withdrawn" ? new Date() : null;
      });
    } catch (error) {
      console.error("NFT withdrawal provider failed", {
        nftId: nft.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return this.settleNftWithdrawalAttempt(nft, (current) => {
        current.status = "failed";
        current.withdrawalError = "Не удалось отправить NFT. Проверьте адрес и повторите попытку.";
        current.withdrawnAt = null;
      });
    }
  }

  private async settleNftWithdrawalAttempt(
    attempt: AccountNft,
    applyResult: (current: AccountNft) => void,
  ) {
    const expectedRequestedAt = attempt.withdrawalRequestedAt?.getTime() ?? null;
    const settled = await this.nfts.manager.transaction(async (manager) => {
      const repository = manager.getRepository(AccountNft);
      const current = await repository.findOne({
        where: { id: attempt.id, phone: attempt.phone },
        lock: { mode: "pessimistic_write" },
      });
      if (!current) throw new NotFoundException("NFT не найден");

      const currentRequestedAt = current.withdrawalRequestedAt?.getTime() ?? null;
      if (current.status !== "pending" || currentRequestedAt !== expectedRequestedAt) {
        return current;
      }

      applyResult(current);
      return repository.save(current);
    });
    return this.publicNft(settled);
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
    await this.accounts.save(account);
    await this.sessions.delete({
      phone,
      expiresAt: LessThanOrEqual(now),
    });
    await this.sessions.save(this.sessions.create({
      tokenHash: this.hash(verificationToken),
      phone,
      expiresAt: new Date(now.getTime() + ACCOUNT_SESSION_TTL_MS),
    }));
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
