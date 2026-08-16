import "reflect-metadata";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { ConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import {
  CreatePickupLocationDto,
  CreateRegionDto,
  CreateProductDto,
  CreatePromotionDto,
  UpdateNftWithdrawalDto,
  UpdateRegionDto,
  UpdateProductDto,
} from "../src/admin/admin.dto";
import {
  AdminAnalyticsQueryDto,
  AdminCustomersQueryDto,
  AdminNftWithdrawalsQueryDto,
  UpdateOrderKitDto,
} from "../src/admin/admin-orders.dto";
import { dispatchOrderStatusPush } from "../src/admin/order-status-notifier";
import { RegisterPushTokenDto } from "../src/auth/push-token.dto";
import {
  CheckWhatsappAuthDto,
  RequestPhoneCodeDto,
  VerifyPhoneCodeDto,
} from "../src/auth/phone-auth.dto";
import { PhoneAuthController } from "../src/auth/phone-auth.controller";
import {
  extractWhatsappAuthCode,
  isWalletAddressValid,
  PhoneAuthService,
  smsResendDelaySeconds,
} from "../src/auth/phone-auth.service";
import type { PhoneAuthChallenge } from "../src/auth/phone-auth.entity";
import { PhoneAccountSession } from "../src/auth/phone-account-session.entity";
import { WhatsappCloudService } from "../src/auth/whatsapp-cloud.service";
import { assertValidModifierGroups } from "../src/catalog/modifier-validation";
import { isDeliveryOpenAt } from "../src/catalog/delivery-hours";
import { regionContentSourceSlug } from "../src/catalog/region-content-source";
import {
  assertYandexMapUrl,
  pickupCoordinatesFromYandexUrl,
} from "../src/catalog/pickup-map-link";
import { seedCategories } from "../src/catalog/seed-data";
import type { ProductModifierGroup } from "../src/catalog/product.entity";
import { POSTGRES_INTEGER_MAX } from "../src/common/numeric-limits";
import { calculateOrderRewards, isNftMilestone } from "../src/rewards/reward-calculation";
import { EduPosApiError, EduPosClient } from "../src/edu-pos/edu-pos.client";
import { createOrRecoverEduPosOrder } from "../src/edu-pos/edu-pos-order-submit";
import {
  buildEduPosMenuExportPayload,
  normalizeEduPosWeightGrams,
} from "../src/edu-pos/edu-pos-menu-export";
import { backfillOrderItemMappings } from "../src/edu-pos/edu-pos-order-mapping";
import type { EduPosMenuExportPayload } from "../src/edu-pos/edu-pos.types";
import {
  canSyncOrderWithEduPos,
  canSubmitOrderToEduPos,
  eduPosRetryDelayMs,
  internalOrderStatusForPos,
  orderStatusAfterPosUpdate,
  shouldSubmitOrderToEduPosAfterAdminTransition,
} from "../src/edu-pos/edu-pos.policy";
import { CreateOrderDto } from "../src/orders/create-order.dto";
import { normalizeOrderKitItems } from "../src/orders/order-kit";
import { OrdersController } from "../src/orders/orders.controller";
import {
  canTransitionOrderStatus,
  OrderStatus,
} from "../src/orders/order.enums";
import { priceOrderLine } from "../src/orders/order-pricing";
import { PushNotificationsService } from "../src/notifications/push-notifications.service";
import { AddPickupLocationsAndPushTokens1784996000000 } from "../src/migrations/1784996000000-AddPickupLocationsAndPushTokens";
import { AddRegionDeliveryDetailsAndZone1784997000000 } from "../src/migrations/1784997000000-AddRegionDeliveryDetailsAndZone";
import { AddSharedRegionContentAndOtuzAdyr1785000000000 } from "../src/migrations/1785000000000-AddSharedRegionContentAndOtuzAdyr";
import { AddShortOrderNumbersAndAdminConfirmation1785002000000 } from "../src/migrations/1785002000000-AddShortOrderNumbersAndAdminConfirmation";
import { AddLoyaltyPrograms1785003000000 } from "../src/migrations/1785003000000-AddLoyaltyPrograms";
import { AddOrderKitItems1785004000000 } from "../src/migrations/1785004000000-AddOrderKitItems";

const baseOrder = {
  idempotencyKey: "order-test-0001",
  verificationToken: "a".repeat(64),
  regionSlug: "bishkek",
  deliveryType: "delivery",
  customerName: "Тест",
  phone: "+996555123456",
  address: "Бишкек",
  latitude: 42.8746,
  longitude: 74.5698,
  paymentMethod: "cash",
  items: [{ productId: 1, quantity: 1, modifiers: [] }],
};

test("admin analytics validates periods and aggregates through PostgreSQL without row limits", () => {
  const valid = plainToInstance(AdminAnalyticsQueryDto, {
    region: "bishkek",
    period: "month",
  });
  assert.deepEqual(validateSync(valid), []);

  const invalid = plainToInstance(AdminAnalyticsQueryDto, {
    region: "bishkek",
    period: "quarter",
  });
  assert.ok(validateSync(invalid).some((error) => error.property === "period"));

  const serviceSource = readFileSync(
    resolve(__dirname, "../src/admin/admin.service.ts"),
    "utf8",
  );
  const controllerSource = readFileSync(
    resolve(__dirname, "../src/admin/admin.controller.ts"),
    "utf8",
  );
  assert.match(controllerSource, /@Get\("analytics"\)/);
  assert.match(controllerSource, /AdminAnalyticsQueryDto/);
  assert.match(serviceSource, /async analytics\(/);
  assert.match(serviceSource, /orderRepository\.query/);
  assert.match(serviceSource, /Asia\/Bishkek/);
  assert.match(serviceSource, /generate_series/);
  assert.match(serviceSource, /interval '4 hours'/);
  assert.match(serviceSource, /interval '20 hours'/);
  assert.match(serviceSource, /orders\."completedAt"/);
  assert.match(serviceSource, /orders\."updatedAt"/);
  assert.match(serviceSource, /orders\."createdAt"/);
  assert.match(serviceSource, /LEFT JOIN completed_orders/);
  assert.match(serviceSource, /COALESCE\(SUM\(completed_orders\."total"\), 0\)/);
  assert.doesNotMatch(serviceSource, /LIMIT\s+2000/i);
});

test("admin customer and NFT withdrawal filters reject invalid query values", () => {
  const customers = plainToInstance(AdminCustomersQueryDto, {
    region: "bishkek",
    search: "Асан",
    limit: "100",
    offset: "0",
  });
  assert.deepEqual(validateSync(customers), []);
  assert.equal(customers.limit, 100);

  const invalidCustomers = plainToInstance(AdminCustomersQueryDto, {
    region: "bishkek",
    limit: "not-a-number",
    offset: "-1",
  });
  assert.ok(validateSync(invalidCustomers).some((error) => error.property === "limit"));
  assert.ok(validateSync(invalidCustomers).some((error) => error.property === "offset"));

  const withdrawals = plainToInstance(AdminNftWithdrawalsQueryDto, {
    region: "bishkek",
    status: "pending",
  });
  assert.deepEqual(validateSync(withdrawals), []);
  const invalidStatus = plainToInstance(AdminNftWithdrawalsQueryDto, {
    status: "processing",
  });
  assert.ok(validateSync(invalidStatus).some((error) => error.property === "status"));

  const serviceSource = readFileSync(
    resolve(__dirname, "../src/admin/admin.service.ts"),
    "utf8",
  );
  assert.match(serviceSource, /WITH matched_phones AS/);
  assert.match(serviceSource, /INNER JOIN matched_phones/);
  assert.match(serviceSource, /const nextTxHash = dto\.txHash !== undefined/);
  assert.match(serviceSource, /dto\.status !== "failed" && !nextTxHash/);
});

test("phone auth DTO normalizes supported numbers and requires CAPTCHA for SMS", () => {
  const request = plainToInstance(RequestPhoneCodeDto, {
    phone: "+996 (555) 123-456",
    captchaToken: "turnstile-token-with-enough-length",
  });
  assert.deepEqual(validateSync(request), []);
  assert.equal(request.phone, "+996555123456");

  const missingCaptcha = plainToInstance(RequestPhoneCodeDto, {
    phone: "+996555123456",
  });
  assert.ok(validateSync(missingCaptcha).some((error) => error.property === "captchaToken"));

  const verified = plainToInstance(VerifyPhoneCodeDto, {
    phone: "+996 555 123 456",
    code: "012345",
  });
  assert.deepEqual(validateSync(verified), []);

  const invalid = plainToInstance(VerifyPhoneCodeDto, {
    phone: "+996 555 123 456",
    code: "1234",
  });
  assert.ok(validateSync(invalid).some((error) => error.property === "code"));

  const whatsappStatus = plainToInstance(CheckWhatsappAuthDto, {
    challengeId: "61db5908-a072-4d2e-8685-a726c5f3278a",
    pollToken: "a".repeat(64),
  });
  assert.deepEqual(validateSync(whatsappStatus), []);
  const invalidPollToken = plainToInstance(CheckWhatsappAuthDto, {
    challengeId: "not-a-uuid",
    pollToken: "short",
  });
  assert.equal(validateSync(invalidPollToken).length, 2);
});

test("region delivery settings validate time, days, and free-delivery threshold", () => {
  const valid = plainToInstance(CreateRegionDto, {
    slug: "test",
    name: "Тест",
    deliveryOpenTime: "11:45",
    deliveryCloseTime: "22:30",
    deliveryIs24Hours: true,
    deliveryWorkingDays: [1, 2, 3, 4, 5],
    freeDeliveryThreshold: 4900,
    deliveryFee: 99,
    estimatedDeliveryMinutes: 50,
    minimumOrderAmount: 900,
    maximumOrderAmount: 30000,
    deliveryZone: [
      { latitude: 42.8, longitude: 74.5 },
      { latitude: 42.9, longitude: 74.6 },
      { latitude: 42.8, longitude: 74.7 },
    ],
  });
  assert.deepEqual(validateSync(valid), []);

  const invalid = plainToInstance(CreateRegionDto, {
    slug: "test",
    name: "Тест",
    deliveryOpenTime: "25:00",
    deliveryCloseTime: "22:70",
    deliveryWorkingDays: [7],
    freeDeliveryThreshold: -1,
    deliveryFee: -1,
    estimatedDeliveryMinutes: 0,
    minimumOrderAmount: -1,
    maximumOrderAmount: 0,
    deliveryZone: [{ latitude: 200, longitude: 300 }],
  });
  assert.ok(validateSync(invalid).length >= 9);
});

test("region settings accept independent menu and promotion sources", () => {
  const valid = plainToInstance(UpdateRegionDto, {
    menuSourceRegionSlug: "osh",
    promotionSourceRegionSlug: "bishkek",
  });
  assert.deepEqual(validateSync(valid), []);

  const tooLong = plainToInstance(UpdateRegionDto, {
    menuSourceRegionSlug: "x".repeat(101),
  });
  assert.ok(validateSync(tooLong).some((error) => error.property === "menuSourceRegionSlug"));
});

test("region NFT program accepts editable milestones and can be disabled", () => {
  for (const everyOrders of [0, 10, 20, 37]) {
    const dto = plainToInstance(UpdateRegionDto, {
      nftRewardEveryOrders: everyOrders,
      nftRewardName: "NAKTA Founder",
      nftRewardNetwork: "polygon",
    });
    assert.deepEqual(validateSync(dto), []);
  }

  const invalid = plainToInstance(UpdateRegionDto, {
    nftRewardEveryOrders: -1,
    nftRewardNetwork: "unknown-chain",
  });
  assert.ok(validateSync(invalid).some((error) => error.property === "nftRewardEveryOrders"));
  assert.ok(validateSync(invalid).some((error) => error.property === "nftRewardNetwork"));

  const submitted = plainToInstance(UpdateNftWithdrawalDto, {
    status: "submitted",
    txHash: "0xabc",
  });
  assert.deepEqual(validateSync(submitted), []);
  const unsupportedStatus = plainToInstance(UpdateNftWithdrawalDto, { status: "pending" });
  assert.ok(validateSync(unsupportedStatus).some((error) => error.property === "status"));
});

test("NAKTA Coin and NFT rewards are calculated independently", () => {
  assert.deepEqual(calculateOrderRewards([
    { naktaCoins: 4 },
    { naktaCoins: 6 },
    { naktaCoins: 0 },
  ] as never), { naktaCoins: 10 });
  assert.equal(isNftMilestone(10, 10), true);
  assert.equal(isNftMilestone(20, 10), true);
  assert.equal(isNftMilestone(20, 20), true);
  assert.equal(isNftMilestone(19, 20), false);
  assert.equal(isNftMilestone(20, 0), false);
});

test("NFT withdrawal validates wallet addresses for supported networks", () => {
  assert.equal(isWalletAddressValid("polygon", `0x${"a".repeat(40)}`), true);
  assert.equal(isWalletAddressValid("ethereum", "0x123"), false);
  assert.equal(isWalletAddressValid("solana", "11111111111111111111111111111111"), true);
  assert.equal(isWalletAddressValid("ton", `0:${"a".repeat(64)}`), true);
  assert.equal(isWalletAddressValid("bitcoin", "bc1qunsupported"), false);
});

test("NFT withdrawal is phone-owned, locked, and becomes pending once", async () => {
  const phone = "+996555123456";
  const token = "a".repeat(64);
  const walletAddress = `0x${"b".repeat(40)}`;
  const nft = {
    id: "11111111-1111-4111-8111-111111111111",
    phone,
    name: "NAKTA #10",
    image: "",
    description: "",
    network: "polygon",
    contractAddress: "",
    metadataUri: "",
    tokenId: "stale-token-id" as string | null,
    status: "failed",
    walletAddress: null,
    txHash: "stale-failed-hash" as string | null,
    withdrawalError: "previous attempt failed" as string | null,
    withdrawalRequestedAt: new Date(0) as Date | null,
    withdrawnAt: null,
    createdAt: new Date(),
    orderId: "22222222-2222-4222-8222-222222222222",
    regionSlug: "bishkek",
    milestoneOrderCount: 10,
  };
  let requestedLock: unknown;
  const repository = {
    findOne: async (options: { lock?: unknown }) => {
      requestedLock = options.lock;
      return nft;
    },
    save: async (value: typeof nft) => value,
  };
  const nfts = {
    manager: {
      transaction: async <T>(callback: (manager: { getRepository: () => typeof repository }) => Promise<T>) => callback({ getRepository: () => repository }),
    },
  };
  const auth = new PhoneAuthService(
    {} as never,
    new ConfigService({ OTP_HASH_SECRET: "s".repeat(64) }),
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { findOneBy: async () => ({ phone, naktaCoins: 0 }) } as never,
    { findOne: async () => ({ phone, tokenHash: "stored", expiresAt: new Date(Date.now() + 60_000) }) } as never,
    nfts as never,
    {} as never,
  );

  const result = await auth.withdrawNft(phone, token, nft.id, walletAddress);
  assert.deepEqual(requestedLock, { mode: "pessimistic_write" });
  assert.equal(result.status, "pending");
  assert.equal(result.walletAddress, walletAddress);
  assert.equal(result.txHash, null);
  assert.equal(result.tokenId, null);
  assert.ok(nft.withdrawalRequestedAt instanceof Date);
  await assert.rejects(
    () => auth.withdrawNft(phone, token, nft.id, walletAddress),
    /уже обрабатывается/,
  );
});

test("a late NFT provider response cannot overwrite a newer admin resolution", async () => {
  const phone = "+996555123456";
  const token = "a".repeat(64);
  const walletAddress = `0x${"c".repeat(40)}`;
  const databaseNft = {
    id: "33333333-3333-4333-8333-333333333333",
    phone,
    name: "NAKTA #20",
    image: "",
    description: "",
    network: "polygon",
    contractAddress: "",
    metadataUri: "",
    tokenId: null as string | null,
    status: "owned",
    walletAddress: null as string | null,
    txHash: null as string | null,
    withdrawalError: null as string | null,
    withdrawalRequestedAt: null as Date | null,
    withdrawnAt: null as Date | null,
    createdAt: new Date(),
    orderId: "44444444-4444-4444-8444-444444444444",
    regionSlug: "bishkek",
    milestoneOrderCount: 20,
  };
  let saveCalls = 0;
  let lockCalls = 0;
  const repository = {
    findOne: async (options: { lock?: unknown }) => {
      lockCalls += 1;
      assert.deepEqual(options.lock, { mode: "pessimistic_write" });
      return { ...databaseNft };
    },
    save: async (value: typeof databaseNft) => {
      saveCalls += 1;
      Object.assign(databaseNft, value);
      return { ...databaseNft };
    },
  };
  const nfts = {
    manager: {
      transaction: async <T>(callback: (manager: { getRepository: () => typeof repository }) => Promise<T>) => callback({ getRepository: () => repository }),
    },
  };
  const auth = new PhoneAuthService(
    {} as never,
    new ConfigService({
      OTP_HASH_SECRET: "s".repeat(64),
      NFT_TRANSFER_WEBHOOK_URL: "https://nft-provider.invalid/transfer",
    }),
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { findOneBy: async () => ({ phone, naktaCoins: 0 }) } as never,
    { findOne: async () => ({ phone, tokenHash: "stored", expiresAt: new Date(Date.now() + 60_000) }) } as never,
    nfts as never,
    {} as never,
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    databaseNft.status = "withdrawn";
    databaseNft.txHash = "admin-confirmed-hash";
    databaseNft.withdrawnAt = new Date();
    return new Response(JSON.stringify({
      status: "submitted",
      txHash: "late-provider-hash",
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  try {
    const result = await auth.withdrawNft(phone, token, databaseNft.id, walletAddress);
    assert.equal(result.status, "withdrawn");
    assert.equal(result.txHash, "admin-confirmed-hash");
    assert.equal(saveCalls, 1);
    assert.equal(lockCalls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("region content sources keep menu and promotions independent", () => {
  const region = {
    slug: "otuz-adyr",
    menuSourceRegionSlug: "osh",
    promotionSourceRegionSlug: "bishkek",
  };
  assert.equal(regionContentSourceSlug(region, "menuSourceRegionSlug"), "osh");
  assert.equal(regionContentSourceSlug(region, "promotionSourceRegionSlug"), "bishkek");
  assert.equal(regionContentSourceSlug({ slug: "osh" }, "menuSourceRegionSlug"), "osh");
  assert.equal(regionContentSourceSlug({
    slug: "osh",
    menuSourceRegionSlug: "osh",
  }, "menuSourceRegionSlug"), "osh");
});

test("SMS resend delays grow from a minute to a day", () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5].map(smsResendDelaySeconds),
    [60, 300, 3_600, 86_400, 86_400],
  );
});

test("pickup coordinates are extracted from full Yandex Maps links", () => {
  assert.deepEqual(
    pickupCoordinatesFromYandexUrl("https://yandex.com/maps/?ll=74.635034%2C42.891111&z=16"),
    { latitude: 42.891111, longitude: 74.635034 },
  );
  assert.deepEqual(
    pickupCoordinatesFromYandexUrl("https://yandex.ru/maps/10309/bishkek/@74.635034,42.891111,16z"),
    { latitude: 42.891111, longitude: 74.635034 },
  );
  assert.throws(
    () => assertYandexMapUrl("https://example.com/maps/?ll=74.6,42.8"),
    /Яндекс Карт/,
  );
});

test("pickup locations and device push tokens reject invalid shared-contract data", () => {
  const pickup = plainToInstance(CreatePickupLocationDto, {
    regionId: 1,
    title: "Кухня на Чуй",
    address: "Бишкек, проспект Чуй, 155",
    workingHours: "Ежедневно, 11:00–23:00",
    latitude: 42.8746,
    longitude: 74.5698,
    yandexUrl: "https://yandex.ru/maps/?ll=74.5698,42.8746",
    enabled: true,
    sortOrder: 0,
  });
  assert.deepEqual(validateSync(pickup), []);

  const invalidPickup = plainToInstance(CreatePickupLocationDto, {
    regionId: 0,
    title: "",
    address: "",
    latitude: 100,
    longitude: 200,
    yandexUrl: "javascript:alert(1)",
  });
  assert.ok(validateSync(invalidPickup).length >= 5);

  const push = plainToInstance(RegisterPushTokenDto, {
    phone: "+996 (555) 123-456",
    deviceId: "61db5908-a072-4d2e-8685-a726c5f3278a",
    expoPushToken: "ExponentPushToken[abcdefghijklmnopqrstuv]",
    platform: "android",
  });
  assert.deepEqual(validateSync(push), []);
  assert.equal(push.phone, "+996555123456");

  const invalidPush = plainToInstance(RegisterPushTokenDto, {
    phone: "+996123",
    deviceId: "device",
    expoPushToken: "not-a-token",
    platform: "windows",
  });
  assert.equal(validateSync(invalidPush).length, 4);
});

test("push token upsert is device-owned and logout deletion is phone-scoped", async () => {
  const records: Array<Record<string, unknown>> = [];
  const deleted: unknown[] = [];
  const repository = {
    findOneBy: async (where: Record<string, unknown>) =>
      records.find((record) => Object.entries(where).every(([key, value]) => record[key] === value)) ?? null,
    create: () => ({}),
    save: async (value: Record<string, unknown>) => {
      const existing = records.findIndex((record) =>
        record.deviceId === value.deviceId || record.expoPushToken === value.expoPushToken);
      const saved = { id: existing >= 0 ? records[existing].id : `token-${records.length + 1}`, ...value };
      if (existing >= 0) records[existing] = saved;
      else records.push(saved);
      return saved;
    },
    delete: async (criteria: unknown) => {
      deleted.push(criteria);
      return { affected: 1 };
    },
  };
  const push = new PushNotificationsService(repository as never);
  const deviceId = "61db5908-a072-4d2e-8685-a726c5f3278a";
  await push.register({
    phone: "+996555123456",
    deviceId,
    expoPushToken: "ExponentPushToken[abcdefghijklmnopqrstuv]",
    platform: "android",
  });
  await push.register({
    phone: "+996700123456",
    deviceId,
    expoPushToken: "ExponentPushToken[zyxwvutsrqponmlkjihgfe]",
    platform: "ios",
  });
  assert.equal(records.length, 1);
  assert.equal(records[0].phone, "+996700123456");
  assert.equal(records[0].platform, "ios");

  assert.deepEqual(
    await push.remove("+996700123456", deviceId),
    { removed: true },
  );
  assert.deepEqual(deleted[0], { phone: "+996700123456", deviceId });
});

test("order status push has a deep link and removes DeviceNotRegistered tokens", async () => {
  const deleted: unknown[] = [];
  const devices = [
    { id: "token-1", phone: "+996555123456", enabled: true, expoPushToken: "ExponentPushToken[first]" },
    { id: "token-2", phone: "+996555123456", enabled: true, expoPushToken: "ExponentPushToken[second]" },
  ];
  const repository = {
    find: async () => devices,
    delete: async (criteria: unknown) => {
      deleted.push(criteria);
      return { affected: 1 };
    },
  };
  const originalFetch = globalThis.fetch;
  let requestBody: unknown;
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({
      data: [
        { status: "ok" },
        { status: "error", details: { error: "DeviceNotRegistered" } },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  try {
    const push = new PushNotificationsService(repository as never);
    await push.sendOrderStatus("+996555123456", "order-42", OrderStatus.READY);
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.deepEqual(
    (requestBody as Array<{ data: Record<string, string> }>).map((message) => message.data),
    [
      { orderId: "order-42", status: "ready", url: "naktasushi://orders/order-42" },
      { orderId: "order-42", status: "ready", url: "naktasushi://orders/order-42" },
    ],
  );
  assert.deepEqual(deleted, [["token-2"]]);
});

test("pickup and push migration has reversible tables and migrates legacy pickup data", async () => {
  const migration = new AddPickupLocationsAndPushTokens1784996000000();
  const upQueries: string[] = [];
  await migration.up({
    query: async (statement: string) => {
      upQueries.push(statement.replace(/\s+/g, " ").trim());
      return [];
    },
  } as never);
  assert.ok(upQueries.some((statement) => statement.includes('CREATE TABLE "pickup_locations"')));
  assert.ok(upQueries.some((statement) =>
    statement.includes('INSERT INTO "pickup_locations"')
    && statement.includes('FROM "regions"')));
  assert.ok(upQueries.some((statement) => statement.includes('CREATE TABLE "device_push_tokens"')));
  assert.ok(upQueries.some((statement) => statement.includes('REFERENCES "phone_accounts"("phone")')));

  const downQueries: string[] = [];
  await migration.down({
    query: async (statement: string) => {
      downQueries.push(statement);
      return [];
    },
  } as never);
  assert.deepEqual(downQueries, [
    'DROP TABLE "device_push_tokens"',
    'DROP TABLE "pickup_locations"',
  ]);
});

test("region delivery details migration adds admin-controlled pricing and zone", async () => {
  const migration = new AddRegionDeliveryDetailsAndZone1784997000000();
  const upQueries: string[] = [];
  await migration.up({
    query: async (statement: string) => {
      upQueries.push(statement.replace(/\s+/g, " ").trim());
      return [];
    },
  } as never);
  assert.ok(upQueries.some((statement) => statement.includes('"deliveryFee"')));
  assert.ok(upQueries.some((statement) => statement.includes('"estimatedDeliveryMinutes"')));
  assert.ok(upQueries.some((statement) => statement.includes('"deliveryZone"')));
  assert.ok(upQueries.some((statement) => statement.includes('jsonb_array_length("deliveryZone") = 0')));

  const downQueries: string[] = [];
  await migration.down({
    query: async (statement: string) => {
      downQueries.push(statement);
      return [];
    },
  } as never);
  assert.equal(downQueries.length, 5);
  assert.ok(downQueries[0].includes('"deliveryZone"'));
});

test("loyalty migration adds reversible NFT ownership and idempotent coin ledgers", async () => {
  const migration = new AddLoyaltyPrograms1785003000000();
  const upQueries: string[] = [];
  await migration.up({
    query: async (statement: string) => {
      upQueries.push(statement.replace(/\s+/g, " ").trim());
      return [];
    },
  } as never);
  assert.ok(upQueries.some((statement) => statement.includes('"nftRewardEveryOrders"')));
  assert.ok(upQueries.some((statement) => statement.includes('CREATE TABLE IF NOT EXISTS "nakta_coin_transactions"')));
  assert.ok(upQueries.some((statement) => statement.includes('"orderId" uuid NOT NULL UNIQUE')));
  assert.ok(upQueries.some((statement) => statement.includes('CREATE TABLE IF NOT EXISTS "account_nfts"')));
  assert.ok(upQueries.some((statement) => statement.includes('"rewardKey" varchar(180) NOT NULL UNIQUE')));
  assert.ok(upQueries.some((statement) => statement.includes("'pending', 'submitted', 'withdrawn', 'failed'")));
  assert.ok(upQueries.some((statement) => statement.includes('ALTER TABLE "nakta_coin_transactions" ADD COLUMN IF NOT EXISTS "regionSlug"')));
  assert.ok(upQueries.some((statement) => statement.includes('ALTER TABLE "account_nfts" ADD COLUMN IF NOT EXISTS "regionSlug"')));
  assert.ok(upQueries.some((statement) => statement.includes('FK_coin_transactions_order')));
  assert.ok(upQueries.some((statement) => statement.includes('FK_account_nfts_phone')));

  const downQueries: string[] = [];
  await migration.down({
    query: async (statement: string) => {
      downQueries.push(statement);
      return [];
    },
  } as never);
  assert.equal(downQueries.length, 9);
  assert.match(downQueries[0], /DROP TABLE IF EXISTS "account_nfts"/);
  assert.match(downQueries[1], /DROP TABLE IF EXISTS "nakta_coin_transactions"/);
});

test("a push failure is isolated after a valid order status transition", async () => {
  const order = {
    id: "order-push-failure",
    phone: "+996555123456",
    status: OrderStatus.CONFIRMED,
  };
  const pushErrors: unknown[] = [];
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    pushErrors.push(args);
  };
  try {
    dispatchOrderStatusPush(
      { sendOrderStatus: async () => { throw new Error("Expo unavailable"); } } as never,
      order,
    );
    await Promise.resolve();
    assert.equal(order.status, OrderStatus.CONFIRMED);
    assert.equal(pushErrors.length, 1);
  } finally {
    console.error = originalConsoleError;
  }
});

test("delivery working hours use Bishkek time and support overnight schedules", () => {
  const daytime = { deliveryOpenTime: "11:30", deliveryCloseTime: "22:30" };
  assert.equal(isDeliveryOpenAt(daytime, new Date("2026-07-29T06:00:00.000Z")), true);
  assert.equal(isDeliveryOpenAt(daytime, new Date("2026-07-29T17:00:00.000Z")), false);

  const overnight = { deliveryOpenTime: "20:00", deliveryCloseTime: "02:00" };
  assert.equal(isDeliveryOpenAt(overnight, new Date("2026-07-29T18:00:00.000Z")), true);
  assert.equal(isDeliveryOpenAt(overnight, new Date("2026-07-29T06:00:00.000Z")), false);

  const weekdaysOnly = { deliveryOpenTime: "11:30", deliveryCloseTime: "22:30", deliveryWorkingDays: [1] };
  assert.equal(isDeliveryOpenAt(weekdaysOnly, new Date("2026-07-29T06:00:00.000Z")), false);

  const aroundTheClock = { deliveryIs24Hours: true, deliveryWorkingDays: [3] };
  assert.equal(isDeliveryOpenAt(aroundTheClock, new Date("2026-07-29T06:00:00.000Z")), true);
  assert.equal(isDeliveryOpenAt(aroundTheClock, new Date("2026-07-30T06:00:00.000Z")), false);
});

test("WhatsApp auth creates a prefilled bot link and verifies Meta signatures", () => {
  const config = new ConfigService({
    WHATSAPP_BOT_PHONE: "+996 555 123 456",
    WHATSAPP_APP_SECRET: "meta-app-secret",
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: "verify-token",
  });
  const whatsapp = new WhatsappCloudService(config);
  assert.equal(whatsapp.isConfigured(), false);
  const code = `NAKTA-${"A1".repeat(24)}`;
  const url = new URL(whatsapp.createAuthUrl(code));
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, "/996555123456");
  assert.match(url.searchParams.get("text") || "", new RegExp(code));
  assert.equal(extractWhatsappAuthCode(`Код: ${code}`), code);
  assert.equal(extractWhatsappAuthCode("обычное сообщение"), null);

  const rawBody = Buffer.from('{"object":"whatsapp_business_account"}');
  const signature = `sha256=${createHmac("sha256", "meta-app-secret").update(rawBody).digest("hex")}`;
  assert.doesNotThrow(() => whatsapp.assertWebhookSignature(rawBody, signature));
  assert.throws(() => whatsapp.assertWebhookSignature(rawBody, "sha256=wrong"));
  assert.doesNotThrow(() =>
    whatsapp.assertWebhookVerification("subscribe", "verify-token"));
  assert.throws(() =>
    whatsapp.assertWebhookVerification("subscribe", "wrong-token"));
});

test("phone auth controller exposes WhatsApp request, status and webhook handlers", () => {
  assert.deepEqual(
    Object.getOwnPropertyNames(PhoneAuthController.prototype).sort(),
    [
      "cancelOrder",
      "checkWhatsapp",
      "constructor",
      "deleteAccount",
      "methods",
      "orderDetails",
      "profile",
      "receiveWhatsappWebhook",
      "registerPushToken",
      "removePushToken",
      "requestCode",
      "requestWhatsapp",
      "verifyCode",
      "verifyWhatsappWebhook",
      "withdrawNft",
    ],
  );
});

test("customers can cancel only their new orders before kitchen submission", async () => {
  const phone = "+996555123456";
  const token = "a".repeat(64);
  const orderId = "11111111-1111-4111-8111-111111111111";
  let orderStatus = OrderStatus.NEW;
  let posSyncStatus = "pending";
  const statements: Array<{ sql: string; parameters: unknown[] }> = [];
  const manager = {
    query: async (sql: string, parameters: unknown[]) => {
      const normalized = sql.replace(/\s+/g, " ").trim();
      statements.push({ sql: normalized, parameters });
      if (normalized.startsWith("SELECT")) {
        return [{ id: orderId, status: orderStatus, posSyncStatus }];
      }
      orderStatus = OrderStatus.CANCELLED;
      return [];
    },
  };
  const accounts = {
    findOneBy: async () => ({ phone, naktaCoins: 0 }),
    manager: {
      transaction: async <T>(callback: (value: typeof manager) => Promise<T>) => callback(manager),
    },
  };
  const sessions = {
    findOne: async () => ({ phone, tokenHash: "stored-token", expiresAt: new Date(Date.now() + 60_000) }),
  };
  const auth = new PhoneAuthService(
    {} as never,
    new ConfigService({ OTP_HASH_SECRET: "s".repeat(64) }),
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    accounts as never,
    sessions as never,
    {} as never,
    {} as never,
  );

  assert.deepEqual(
    await auth.cancelOrder(phone, token, orderId),
    { id: orderId, status: OrderStatus.CANCELLED },
  );
  assert.match(statements[0].sql, /FOR UPDATE$/);
  assert.deepEqual(statements[1].parameters, [OrderStatus.CANCELLED, phone, orderId]);

  orderStatus = OrderStatus.CONFIRMED;
  await assert.rejects(
    () => auth.cancelOrder(phone, token, orderId),
    /Заказ уже подтверждён/,
  );

  orderStatus = OrderStatus.NEW;
  posSyncStatus = "submitting";
  await assert.rejects(
    () => auth.cancelOrder(phone, token, orderId),
    /Заказ уже подтверждается/,
  );
});

test("account deletion verifies the session and removes all phone-owned profile data", async () => {
  const phone = "+996555123456";
  const token = "a".repeat(64);
  const statements: Array<{ sql: string; parameters: unknown[] }> = [];
  const manager = {
    query: async (sql: string, parameters: unknown[]) => {
      statements.push({ sql: sql.replace(/\s+/g, " ").trim(), parameters });
      return [];
    },
  };
  const accounts = {
    findOneBy: async () => ({ phone, naktaCoins: 0 }),
    manager: {
      transaction: async (callback: (value: typeof manager) => Promise<void>) => callback(manager),
    },
  };
  const sessions = {
    findOne: async () => ({ phone, tokenHash: "stored-token", expiresAt: new Date(Date.now() + 60_000) }),
  };
  const auth = new PhoneAuthService(
    {} as never,
    new ConfigService({ OTP_HASH_SECRET: "s".repeat(64) }),
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    accounts as never,
    sessions as never,
    {} as never,
    {} as never,
  );

  assert.deepEqual(await auth.deleteAccount(phone, token), { deleted: true });
  assert.deepEqual(statements.map((item) => item.parameters), [[phone], [phone], [phone]]);
  assert.match(statements[0].sql, /DELETE FROM "orders"/);
  assert.match(statements[1].sql, /DELETE FROM "phone_auth_challenges"/);
  assert.match(statements[2].sql, /DELETE FROM "phone_accounts"/);
});

test("WhatsApp webhook verifies the sender and unlocks polling", async () => {
  const records: PhoneAuthChallenge[] = [];
  const matches = (record: PhoneAuthChallenge, where: Record<string, unknown>) =>
    Object.entries(where).every(([key, expected]) => {
      const actual = record[key as keyof PhoneAuthChallenge];
      if (
        expected
        && typeof expected === "object"
        && "_type" in expected
      ) {
        const operator = expected as { _type: string; _value: unknown };
        if (operator._type === "moreThan") {
          return actual instanceof Date
            && operator._value instanceof Date
            && actual > operator._value;
        }
        if (operator._type === "isNull") return actual === null;
      }
      return actual === expected;
    });
  const repository = {
    create: (value: PhoneAuthChallenge) => ({
      ...value,
      createdAt: value.createdAt ?? new Date(),
    }),
    save: async (value: PhoneAuthChallenge) => {
      const index = records.findIndex((record) => record.id === value.id);
      if (index >= 0) records[index] = value;
      else records.push(value);
      return value;
    },
    findOne: async ({ where }: { where: Record<string, unknown> }) =>
      records.filter((record) => matches(record, where))
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0] ?? null,
    count: async () => 0,
  };
  const replies: Array<{ to: string; body: string }> = [];
  const accounts: Array<{ phone: string; sessionTokenHash: string | null; sessionExpiresAt: Date | null }> = [];
  const sessions: PhoneAccountSession[] = [];
  const accountRepository = {
    findOneBy: async ({ phone }: { phone: string }) => accounts.find((account) => account.phone === phone) ?? null,
    create: (value: { phone: string }) => ({ ...value, sessionTokenHash: null, sessionExpiresAt: null }),
    save: async (value: { phone: string; sessionTokenHash: string | null; sessionExpiresAt: Date | null }) => {
      const index = accounts.findIndex((account) => account.phone === value.phone);
      if (index >= 0) accounts[index] = value;
      else accounts.push(value);
      return value;
    },
  };
  const sessionRepository = {
    create: (value: PhoneAccountSession) => ({ ...value, createdAt: new Date() }),
    save: async (value: PhoneAccountSession) => {
      const index = sessions.findIndex((session) => session.tokenHash === value.tokenHash);
      if (index >= 0) sessions[index] = value;
      else sessions.push(value);
      return value;
    },
    delete: async () => ({ affected: 0 }),
    findOne: async ({ where }: { where: { phone: string; tokenHash: string } }) =>
      sessions.find((session) => (
        session.phone === where.phone
        && session.tokenHash === where.tokenHash
        && session.expiresAt > new Date()
      )) ?? null,
  };
  const whatsapp = {
    createAuthUrl: (code: string) =>
      `https://wa.me/996555123456?text=${encodeURIComponent(`Код: ${code}`)}`,
    acceptsPhoneNumberId: (id: string) => id === "phone-id",
    sendText: async (to: string, body: string) => {
      replies.push({ to, body });
      return true;
    },
  };
  const auth = new PhoneAuthService(
    repository as never,
    new ConfigService({ OTP_HASH_SECRET: "s".repeat(64) }),
    {} as never,
    whatsapp as never,
    {} as never,
    { existsBy: async () => false } as never,
    accountRepository as never,
    sessionRepository as never,
    {} as never,
    {} as never,
  );

  const requested = await auth.requestWhatsapp("+996555123456");
  const code = extractWhatsappAuthCode(
    new URL(requested.whatsappUrl).searchParams.get("text") || "",
  );
  assert.ok(code);
  await auth.handleWhatsappWebhook({
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        field: "messages",
        value: {
          metadata: { phone_number_id: "phone-id" },
          messages: [{
            from: "996555123456",
            type: "text",
            text: { body: `Код: ${code}` },
          }],
        },
      }],
    }],
  });

  assert.match(replies[0]?.body || "", /номер подтверждён/i);
  const status = await auth.checkWhatsapp(requested.challengeId, requested.pollToken);
  assert.equal(status.status, "verified");
  assert.equal(status.phone, "+996555123456");
  assert.equal(status.verificationToken?.length, 64);
  if (status.status !== "verified") throw new Error("Expected a verified WhatsApp session");
  const sessionManager = {
    getRepository: (entity: unknown) => entity === PhoneAccountSession
      ? sessionRepository
      : repository,
  };
  await auth.consumeVerification(status.phone, status.verificationToken, sessionManager as never);
  await auth.consumeVerification(status.phone, status.verificationToken, sessionManager as never);
});

test("website and app sessions stay valid together for the same phone account", async () => {
  const phone = "+996555123456";
  const account = { phone, naktaCoins: 25 };
  const sessionRecords: PhoneAccountSession[] = [];
  const accountRepository = {
    findOneBy: async ({ phone: requestedPhone }: { phone: string }) =>
      requestedPhone === phone ? account : null,
    create: (value: { phone: string }) => ({ ...value, naktaCoins: 0 }),
    save: async (value: typeof account) => value,
  };
  const sessionRepository = {
    create: (value: PhoneAccountSession) => ({ ...value, createdAt: new Date() }),
    save: async (value: PhoneAccountSession) => {
      sessionRecords.push(value);
      return value;
    },
    delete: async () => ({ affected: 0 }),
    findOne: async ({ where }: { where: { phone: string; tokenHash: string } }) =>
      sessionRecords.find((session) => (
        session.phone === where.phone
        && session.tokenHash === where.tokenHash
        && session.expiresAt > new Date()
      )) ?? null,
  };
  const auth = new PhoneAuthService(
    {
      create: (value: PhoneAuthChallenge) => value,
      save: async (value: PhoneAuthChallenge) => value,
    } as never,
    new ConfigService({ OTP_HASH_SECRET: "s".repeat(64) }),
    {} as never,
    {} as never,
    { verify: async () => undefined } as never,
    { existsBy: async () => true } as never,
    accountRepository as never,
    sessionRepository as never,
    {} as never,
    {} as never,
  );

  const website = await auth.requestCode(phone, "captcha-token-with-enough-length", "127.0.0.1");
  const app = await auth.requestCode(phone, "captcha-token-with-enough-length", "127.0.0.1");
  assert.equal(website.verified, true);
  assert.equal(app.verified, true);
  assert.ok(website.verificationToken);
  assert.ok(app.verificationToken);
  assert.notEqual(website.verificationToken, app.verificationToken);
  assert.equal(sessionRecords.length, 2);
  assert.equal((await auth.assertAccount(phone, website.verificationToken)).naktaCoins, 25);
  assert.equal((await auth.assertAccount(phone, app.verificationToken)).naktaCoins, 25);
});

test("order DTO accepts KG and RU E.164 phones and rejects empty orders", () => {
  for (const phone of ["+996555123456", "+79991234567", "+996 (555) 123-456"]) {
    const dto = plainToInstance(CreateOrderDto, {
      ...baseOrder,
      phone,
      paymentMethod: "card_on_delivery",
    });
    assert.deepEqual(validateSync(dto), []);
    assert.equal(dto.paymentMethod, "card");
  }

  const empty = plainToInstance(CreateOrderDto, { ...baseOrder, items: [] });
  assert.ok(validateSync(empty).some((error) => error.property === "items"));

  const excessiveQuantity = plainToInstance(CreateOrderDto, {
    ...baseOrder,
    items: [{ productId: 1, quantity: 21 }],
  });
  assert.ok(validateSync(excessiveQuantity).some((error) => error.property === "items"));

  const maximumModifierQuantity = plainToInstance(CreateOrderDto, {
    ...baseOrder,
    items: [{
      productId: 1,
      quantity: 1,
      modifiers: [{ groupId: "sauce", itemId: "cheese", quantity: 99 }],
    }],
  });
  assert.deepEqual(validateSync(maximumModifierQuantity), []);

  const excessiveModifierQuantity = plainToInstance(CreateOrderDto, {
    ...baseOrder,
    items: [{
      productId: 1,
      quantity: 1,
      modifiers: [{ groupId: "sauce", itemId: "cheese", quantity: 100 }],
    }],
  });
  assert.ok(validateSync(excessiveModifierQuantity).some((error) => error.property === "items"));

  const invalidCoordinates = plainToInstance(CreateOrderDto, {
    ...baseOrder,
    latitude: 91,
    longitude: -181,
  });
  const coordinateErrors = validateSync(invalidCoordinates);
  assert.ok(coordinateErrors.some((error) => error.property === "latitude"));
  assert.ok(coordinateErrors.some((error) => error.property === "longitude"));
});

test("order kit validates, keeps explicit quantities, and preserves mobile defaults", () => {
  const selections = [
    { id: "soy-sauce", quantity: 2 },
    { id: "wasabi", quantity: 0 },
    { id: "pickled-ginger", quantity: 3 },
  ];
  const orderDto = plainToInstance(CreateOrderDto, { ...baseOrder, kitItems: selections });
  const adminDto = plainToInstance(UpdateOrderKitDto, {
    utensilsCount: 2,
    noUtensils: false,
    kitItems: selections,
  });
  assert.deepEqual(validateSync(orderDto), []);
  assert.deepEqual(validateSync(adminDto), []);
  assert.deepEqual(normalizeOrderKitItems(selections), [
    { id: "soy-sauce", name: "Соевый соус", quantity: 2 },
    { id: "wasabi", name: "Васаби", quantity: 0 },
    { id: "pickled-ginger", name: "Имбирь маринованный", quantity: 3 },
  ]);
  assert.deepEqual(normalizeOrderKitItems(), [
    { id: "soy-sauce", name: "Соевый соус", quantity: 1 },
    { id: "wasabi", name: "Васаби", quantity: 1 },
    { id: "pickled-ginger", name: "Имбирь маринованный", quantity: 1 },
  ]);
  assert.throws(() => normalizeOrderKitItems([
    { id: "soy-sauce", quantity: 1 },
    { id: "soy-sauce", quantity: 2 },
  ]), /несколько раз/);

  const invalid = plainToInstance(UpdateOrderKitDto, {
    utensilsCount: 1,
    noUtensils: false,
    kitItems: [{ id: "unknown", quantity: 21 }],
  });
  assert.ok(validateSync(invalid).some((error) => error.property === "kitItems"));
});

const modifierGroups: ProductModifierGroup[] = [
  {
    id: "sauce",
    title: "Соус",
    selectionType: "single",
    required: true,
    minSelections: 1,
    maxSelections: 1,
    items: [
      { id: "cheese", name: "Сырный", price: 20, image: "", enabled: true },
      { id: "spicy", name: "Острый", price: 30, image: "", enabled: true },
    ],
  },
  {
    id: "extras",
    title: "Добавки",
    selectionType: "multiple",
    required: false,
    minSelections: 0,
    maxSelections: 2,
    items: [
      { id: "ginger", name: "Имбирь", price: 5, image: "", enabled: true },
      { id: "wasabi", name: "Васаби", price: 7, image: "", enabled: true },
      { id: "hidden", name: "Скрытая", price: 1, image: "", enabled: false },
    ],
  },
];

const product = {
  id: 10,
  name: "Тестовый товар",
  price: 100,
  modifierGroups,
};

test("legacy modifier groups default to per-product pricing and quantity 20", () => {
  const line = priceOrderLine(product, 2, [
    { groupId: "sauce", itemId: "cheese", quantity: 1 },
    { groupId: "extras", itemId: "ginger", quantity: 3 },
    { groupId: "extras", itemId: "wasabi", quantity: 2 },
  ]);

  assert.equal(line.basePrice, 100);
  assert.equal(line.baseTotal, 200);
  assert.equal(line.modifiersPrice, 49);
  assert.equal(line.modifiersTotal, 98);
  assert.equal(line.unitPrice, 149);
  assert.equal(line.lineTotal, 298);
  assert.equal(line.pricingVersion, "scoped-v2");
  assert.deepEqual(
    line.modifierSnapshots.map(
      ({ itemId, quantity, totalPrice, priceScope }) =>
        ({ itemId, quantity, totalPrice, priceScope }),
    ),
    [
      { itemId: "cheese", quantity: 1, totalPrice: 20, priceScope: "per-product" },
      { itemId: "ginger", quantity: 3, totalPrice: 15, priceScope: "per-product" },
      { itemId: "wasabi", quantity: 2, totalPrice: 14, priceScope: "per-product" },
    ],
  );

  assert.throws(() => priceOrderLine(product, 1, []), /Select at least 1/);
  assert.throws(() => priceOrderLine(product, 1, [
    { groupId: "sauce", itemId: "cheese", quantity: 2 },
  ]), /cannot exceed 1/);
  assert.throws(() => priceOrderLine(product, 1, [
    { groupId: "sauce", itemId: "cheese", quantity: 1 },
    { groupId: "extras", itemId: "hidden", quantity: 1 },
  ]), /unavailable/);
  assert.throws(() => priceOrderLine(product, 1, [
    { groupId: "sauce", itemId: "cheese", quantity: 1 },
    { groupId: "extras", itemId: "ginger", quantity: 1 },
    { groupId: "extras", itemId: "wasabi", quantity: 1 },
    { groupId: "extras", itemId: "other", quantity: 1 },
  ]), /Unknown modifier/);

  assert.throws(() => priceOrderLine(product, 1, [
    { groupId: "sauce", itemId: "cheese", quantity: 1 },
    { groupId: "extras", itemId: "ginger", quantity: 21 },
  ]), /cannot exceed 20/);
});

test("per-line pricing preserves original cart arithmetic and independent limits", () => {
  const exactProduct = {
    id: 11,
    name: "Картофель фри",
    price: 275,
    modifierGroups: [
      {
        id: "fries-sauce",
        title: "Основной соус",
        selectionType: "single" as const,
        required: false,
        minSelections: 0,
        maxSelections: 1,
        priceScope: "per-line" as const,
        items: [
          {
            id: "cheese",
            name: "Сырный",
            price: 0,
            image: "",
            enabled: true,
            maxQuantity: 1,
          },
        ],
      },
      {
        id: "extra-sauce",
        title: "Дополнительный соус",
        selectionType: "multiple" as const,
        required: false,
        minSelections: 0,
        maxSelections: 1,
        priceScope: "per-line" as const,
        items: [
          {
            id: "sweet-chili",
            name: "Сладкий чили",
            price: 100,
            image: "",
            enabled: true,
            maxQuantity: 99,
          },
          {
            id: "caesar",
            name: "Цезарь",
            price: 180,
            image: "",
            enabled: true,
            maxQuantity: 99,
          },
        ],
      },
    ],
  };

  const withoutOptionalSauce = priceOrderLine(exactProduct, 2, []);
  assert.equal(withoutOptionalSauce.lineTotal, 550);

  const line = priceOrderLine(exactProduct, 2, [
    { groupId: "extra-sauce", itemId: "sweet-chili", quantity: 3 },
  ]);
  assert.equal(line.baseTotal, 550);
  assert.equal(line.modifiersPrice, 300);
  assert.equal(line.modifiersTotal, 300);
  assert.equal(line.unitPrice, 275);
  assert.equal(line.lineTotal, 850);
  assert.equal(line.modifierSnapshots[0].priceScope, "per-line");

  assert.throws(() => priceOrderLine(exactProduct, 1, [
    { groupId: "extra-sauce", itemId: "sweet-chili", quantity: 1 },
    { groupId: "extra-sauce", itemId: "caesar", quantity: 1 },
  ]), /Select no more than 1/);
  assert.throws(() => priceOrderLine(exactProduct, 1, [
    { groupId: "extra-sauce", itemId: "sweet-chili", quantity: 100 },
  ]), /between 1 and 99/);
});

test("required choices and per-item quantities are validated independently", () => {
  const champion = {
    id: 12,
    name: "Чемпион",
    price: 1_000,
    modifierGroups: [{
      id: "drink",
      title: "Напиток",
      selectionType: "multiple" as const,
      required: true,
      minSelections: 1,
      maxSelections: 2,
      priceScope: "per-line" as const,
      items: ["cola", "fanta", "tonic"].map((id) => ({
        id,
        name: id,
        price: id === "tonic" ? 15 : 0,
        image: "",
        enabled: true,
        maxQuantity: 1,
      })),
    }],
  };

  assert.throws(() => priceOrderLine(champion, 1, []), /Select at least 1/);
  assert.equal(priceOrderLine(champion, 1, [
    { groupId: "drink", itemId: "cola", quantity: 1 },
    { groupId: "drink", itemId: "tonic", quantity: 1 },
  ]).lineTotal, 1_015);
  assert.throws(() => priceOrderLine(champion, 1, [
    { groupId: "drink", itemId: "cola", quantity: 2 },
  ]), /cannot exceed 1/);
  assert.throws(() => priceOrderLine(champion, 1, [
    { groupId: "drink", itemId: "cola", quantity: 1 },
    { groupId: "drink", itemId: "fanta", quantity: 1 },
    { groupId: "drink", itemId: "tonic", quantity: 1 },
  ]), /Select no more than 2/);
});

test("server caps pathological aggregate modifier quantities", () => {
  const manyExtras = {
    ...product,
    modifierGroups: [{
      id: "many",
      title: "Много добавок",
      selectionType: "multiple" as const,
      required: false,
      maxSelections: 6,
      items: ["one", "two", "three", "four", "five", "six"].map((id) => ({
        id,
        name: id,
        price: 1,
        image: "",
        enabled: true,
        maxQuantity: 99,
      })),
    }],
  };
  assert.throws(() => priceOrderLine(
    manyExtras,
    1,
    ["one", "two", "three", "four", "five", "six"].map((itemId) => ({
      groupId: "many",
      itemId,
      quantity: 99,
    })),
  ), /cannot exceed 500/);
});

test("priced values must fit PostgreSQL integer columns", () => {
  assert.throws(() => priceOrderLine({
    id: 13,
    name: "Overflow",
    price: POSTGRES_INTEGER_MAX,
    modifierGroups: [],
  }, 2), /Invalid base total/);

  assert.throws(() => priceOrderLine({
    id: 14,
    name: "Modifier overflow",
    price: 0,
    modifierGroups: [{
      id: "extra",
      title: "Добавка",
      selectionType: "multiple",
      required: false,
      maxSelections: 1,
      priceScope: "per-line",
      items: [{
        id: "expensive",
        name: "Дорогая добавка",
        price: POSTGRES_INTEGER_MAX,
        image: "",
        maxQuantity: 2,
      }],
    }],
  }, 1, [
    { groupId: "extra", itemId: "expensive", quantity: 2 },
  ]), /Invalid modifier total/);
});

test("configuration key distinguishes modifier quantities", () => {
  const first = priceOrderLine(product, 1, [
    { groupId: "sauce", itemId: "cheese", quantity: 1 },
    { groupId: "extras", itemId: "ginger", quantity: 1 },
  ]);
  const second = priceOrderLine(product, 1, [
    { groupId: "sauce", itemId: "cheese", quantity: 1 },
    { groupId: "extras", itemId: "ginger", quantity: 2 },
  ]);
  assert.notEqual(first.configurationKey, second.configurationKey);

  const perLine = priceOrderLine({
    ...product,
    modifierGroups: product.modifierGroups.map((group) => ({
      ...group,
      priceScope: "per-line" as const,
    })),
  }, 1, [
    { groupId: "sauce", itemId: "cheese", quantity: 1 },
    { groupId: "extras", itemId: "ginger", quantity: 1 },
  ]);
  assert.notEqual(first.configurationKey, perLine.configurationKey);
});

test("admin modifier DTO validates nested catalog data", () => {
  const invalid = plainToInstance(CreateProductDto, {
    regionSlug: "bishkek",
    categoryId: 1,
    name: "Товар",
    slug: "tovar",
    price: 100,
    image: "https://example.com/image.webp",
    modifierGroups: [{
      id: "group",
      title: "Группа",
      selectionType: "wrong",
      required: true,
      priceScope: "per-order",
      items: [{
        id: "item",
        name: "Добавка",
        price: -1,
        image: "",
        maxQuantity: 100,
      }],
    }],
  });
  assert.ok(validateSync(invalid).some((error) => error.property === "modifierGroups"));
});

test("admin product DTO accepts clearing a discount and validates old price bounds", () => {
  const clearDiscount = plainToInstance(UpdateProductDto, { oldPrice: null });
  assert.deepEqual(validateSync(clearDiscount), []);

  const invalidOldPrice = plainToInstance(UpdateProductDto, { oldPrice: -1 });
  assert.ok(validateSync(invalidOldPrice).some((error) => error.property === "oldPrice"));
});

test("admin catalog semantics reject inconsistent modifier groups", () => {
  assert.throws(() => assertValidModifierGroups([{
      id: "drink",
      title: "Напиток",
      selectionType: "multiple",
      required: true,
      minSelections: 2,
      maxSelections: 1,
      priceScope: "per-line",
      items: [{
        id: "cola",
        name: "Кола",
        price: 0,
        image: "",
        enabled: true,
        maxQuantity: 1,
      }],
    }]),
    /Invalid maximum selections in Напиток/,
  );

  assert.throws(() => assertValidModifierGroups([{
    id: "single",
    title: "Один вариант",
    selectionType: "single",
    required: false,
    items: [{
      id: "item",
      name: "Вариант",
      price: 0,
      image: "",
      maxQuantity: 2,
    }],
  }]), /maximum quantity 1/);

  assert.throws(() => assertValidModifierGroups([{
    id: "required-disabled",
    title: "Недоступные варианты",
    selectionType: "multiple",
    required: true,
    minSelections: 1,
    maxSelections: 2,
    items: [{
      id: "disabled",
      name: "Недоступен",
      price: 0,
      image: "",
      enabled: false,
      maxQuantity: 1,
    }],
  }]), /requires more enabled options/);

  const tooManyRequiredGroups: ProductModifierGroup[] = Array.from(
    { length: 6 },
    (_, groupIndex) => ({
      id: `required-${groupIndex}`,
      title: `Обязательная группа ${groupIndex}`,
      selectionType: "multiple",
      required: true,
      minSelections: 90,
      maxSelections: 90,
      items: Array.from({ length: 90 }, (_, itemIndex) => ({
        id: `item-${itemIndex}`,
        name: `Вариант ${itemIndex}`,
        price: 0,
        image: "",
        maxQuantity: 1,
      })),
    }),
  );
  assert.throws(
    () => assertValidModifierGroups(tooManyRequiredGroups),
    /Required modifier quantity cannot exceed 500/,
  );
});

test("empty promotion CTA URL is optional but malformed URLs are rejected", () => {
  const empty = plainToInstance(CreatePromotionDto, {
    regionSlug: "bishkek",
    title: "Акция",
    image: "https://example.com/image.webp",
    cta: "",
    ctaUrl: "",
  });
  assert.deepEqual(validateSync(empty), []);

  const invalid = plainToInstance(CreatePromotionDto, {
    regionSlug: "bishkek",
    title: "Акция",
    image: "https://example.com/image.webp",
    cta: "Подробнее",
    ctaUrl: "not-a-url",
  });
  assert.ok(validateSync(invalid).some((error) => error.property === "ctaUrl"));
});

test("order statuses allow only explicit transitions", () => {
  assert.equal(canTransitionOrderStatus(OrderStatus.NEW, OrderStatus.CONFIRMED), true);
  assert.equal(canTransitionOrderStatus(OrderStatus.NEW, OrderStatus.COMPLETED), false);
  assert.equal(canTransitionOrderStatus(OrderStatus.COMPLETED, OrderStatus.NEW), false);
  assert.equal(canTransitionOrderStatus(OrderStatus.READY, OrderStatus.COMPLETED), true);
});

test("shared region migration adds source selectors and seeds Otuz-Adyr", async () => {
  const migration = new AddSharedRegionContentAndOtuzAdyr1785000000000();
  const queries: Array<{ statement: string; parameters?: unknown[] }> = [];
  await migration.up({
    query: async (statement: string, parameters?: unknown[]) => {
      queries.push({ statement: statement.replace(/\s+/g, " ").trim(), parameters });
      return [];
    },
  } as never);

  assert.ok(queries.some(({ statement }) => statement.includes('"menuSourceRegionSlug"')));
  assert.ok(queries.some(({ statement }) => statement.includes('"promotionSourceRegionSlug"')));
  const seed = queries.find(({ statement }) => statement.includes("INSERT INTO \"regions\""));
  assert.ok(seed?.statement.includes("'otuz-adyr'"));
  assert.ok(seed?.statement.includes("'Отуз-Адыр'"));
  assert.ok(seed?.statement.includes("'osh', 'osh'"));
  assert.ok(String(seed?.parameters?.[0]).includes("40.64"));
});

test("order number migration adds a short sequence and admin confirmation marker", async () => {
  const migration = new AddShortOrderNumbersAndAdminConfirmation1785002000000();
  const queries: string[] = [];
  await migration.up({
    query: async (statement: string) => {
      queries.push(statement.replace(/\s+/g, " ").trim());
      return [];
    },
  } as never);

  assert.ok(queries.some((statement) => statement.includes('CREATE SEQUENCE IF NOT EXISTS "orders_order_number_seq"')));
  assert.ok(queries.some((statement) => statement.includes('ADD COLUMN IF NOT EXISTS "orderNumber" integer')));
  assert.ok(queries.some((statement) => statement.includes('CREATE UNIQUE INDEX IF NOT EXISTS "IDX_orders_order_number"')));
  assert.ok(queries.some((statement) => statement.includes('ADD COLUMN IF NOT EXISTS "adminConfirmedAt"')));
});

test("order kit migration adds reversible persisted complectation", async () => {
  const migration = new AddOrderKitItems1785004000000();
  const upQueries: string[] = [];
  const downQueries: string[] = [];
  await migration.up({
    query: async (statement: string) => { upQueries.push(statement); return []; },
  } as never);
  await migration.down({
    query: async (statement: string) => { downQueries.push(statement); return []; },
  } as never);
  assert.ok(upQueries.some((statement) => statement.includes('ADD COLUMN IF NOT EXISTS "kitItems" jsonb')));
  assert.ok(downQueries.some((statement) => statement.includes('DROP COLUMN IF EXISTS "kitItems"')));

  const dataSource = readFileSync(resolve(__dirname, "../src/data-source.ts"), "utf8");
  const appModule = readFileSync(resolve(__dirname, "../src/app.module.ts"), "utf8");
  const packageJson = readFileSync(resolve(__dirname, "../package.json"), "utf8");
  assert.match(dataSource, /AddOrderKitItems1785004000000/);
  assert.match(appModule, /AddOrderKitItems1785004000000/);
  assert.match(packageJson, /typeorm -d dist\/data-source\.js migration:run && node dist\/main\.js/);
});

test("EDU POS status mapping and retry schedule follow the delivery contract", () => {
  assert.equal(canSubmitOrderToEduPos(OrderStatus.NEW), false);
  assert.equal(canSubmitOrderToEduPos(OrderStatus.CONFIRMED), true);
  assert.equal(canSubmitOrderToEduPos(OrderStatus.CANCELLED), false);
  assert.equal(canSyncOrderWithEduPos(OrderStatus.CONFIRMED, null), false);
  assert.equal(canSyncOrderWithEduPos(OrderStatus.CONFIRMED, new Date()), true);
  assert.equal(canSyncOrderWithEduPos(OrderStatus.NEW, new Date()), false);
  assert.equal(shouldSubmitOrderToEduPosAfterAdminTransition(
    OrderStatus.NEW,
    OrderStatus.CONFIRMED,
  ), true);
  assert.equal(shouldSubmitOrderToEduPosAfterAdminTransition(
    OrderStatus.NEW,
    OrderStatus.CANCELLED,
  ), false);
  assert.equal(shouldSubmitOrderToEduPosAfterAdminTransition(
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
  ), false);
  assert.equal(internalOrderStatusForPos("sent_to_kitchen"), OrderStatus.CONFIRMED);
  assert.equal(internalOrderStatusForPos("accepted_by_kitchen"), OrderStatus.CONFIRMED);
  assert.equal(internalOrderStatusForPos("cooking"), OrderStatus.PREPARING);
  assert.equal(internalOrderStatusForPos("partially_rejected"), OrderStatus.PREPARING);
  assert.equal(internalOrderStatusForPos("ready"), OrderStatus.READY);
  assert.equal(internalOrderStatusForPos("rejected"), OrderStatus.CANCELLED);
  assert.equal(
    orderStatusAfterPosUpdate(OrderStatus.NEW, "sent_to_kitchen", false),
    OrderStatus.NEW,
  );
  assert.equal(
    orderStatusAfterPosUpdate(OrderStatus.NEW, "sent_to_kitchen", true),
    OrderStatus.CONFIRMED,
  );
  assert.equal(
    orderStatusAfterPosUpdate(OrderStatus.DELIVERING, "cooking", true),
    OrderStatus.DELIVERING,
  );
  assert.deepEqual([1, 2, 3, 4, 5].map(eduPosRetryDelayMs), [5_000, 15_000, 30_000, 60_000, 60_000]);
});

test("EDU POS client keeps the API key server-side and validates order progress", async () => {
  const originalFetch = globalThis.fetch;
  let capturedHeaders: HeadersInit | undefined;
  let capturedBody = "";
  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    capturedHeaders = init?.headers;
    capturedBody = String(init?.body || "");
    return new Response(JSON.stringify({
      id: "pos-order-1",
      externalOrderId: "NAKTA-checkout-1",
      orderNumber: "42",
      status: "cooking",
      completed: false,
      progress: { itemsTotal: 3, itemsReady: 1, itemsRejected: 0 },
      items: [{
        dishId: "dish-1",
        variantId: null,
        name: "Ролл",
        quantity: 3,
        readyQuantity: 1,
        status: "cooking",
        rejectReason: null,
      }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;

  try {
    const client = new EduPosClient(new ConfigService({
      EDU_POS_URL: "https://pos.example/api/integration/v1",
      EDU_POS_API_KEY: "edu_live_test_secret",
    }));
    const order = await client.createOrder({
      externalOrderId: "NAKTA-checkout-1",
      items: [{ dishId: "dish-1", quantity: 3 }],
    });
    assert.equal(new Headers(capturedHeaders).get("X-API-Key"), "edu_live_test_secret");
    assert.equal(JSON.parse(capturedBody).items[0].dishId, "dish-1");
    assert.deepEqual(order.progress, { itemsTotal: 3, itemsReady: 1, itemsRejected: 0 });
    assert.equal(order.items[0].status, "cooking");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("EDU POS client classifies temporary errors without exposing credentials", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(
    JSON.stringify({ message: [
      "temporarily unavailable: edu_live_must_not_leak",
      "menu payload rejected",
    ] }),
    { status: 503, headers: { "Content-Type": "application/json" } },
  )) as typeof fetch;
  try {
    const client = new EduPosClient(new ConfigService({
      EDU_POS_URL: "https://pos.example/api/integration/v1",
      EDU_POS_API_KEY: "edu_live_must_not_leak",
    }));
    await assert.rejects(
      () => client.menu(),
      (error: unknown) => error instanceof EduPosApiError
        && error.status === 503
        && error.retryable
        && error.message.includes("menu payload rejected")
        && !error.message.includes("edu_live_must_not_leak"),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("EDU POS client exports the complete menu with one configured PUT request", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedMethod = "";
  let capturedBody = "";
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedMethod = init?.method || "";
    capturedBody = String(init?.body || "");
    return new Response(JSON.stringify({ imported: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  try {
    const client = new EduPosClient(new ConfigService({
      EDU_POS_URL: "https://pos.example/api/integration/v1",
      EDU_POS_API_KEY: "edu_live_export_secret",
      EDU_POS_MENU_EXPORT_PATH: "/catalog/import",
    }));
    const payload: EduPosMenuExportPayload = {
      source: "nakta-sushi",
      regionSlug: "bishkek",
      menuSourceRegionSlug: "bishkek",
      exportedAt: "2026-08-14T00:00:00.000Z",
      categories: [],
    };
    await client.exportMenu(payload);
    assert.equal(capturedUrl, "https://pos.example/api/integration/v1/catalog/import");
    assert.equal(capturedMethod, "PUT");
    assert.deepEqual(JSON.parse(capturedBody), payload);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("EDU POS retries recover an order before attempting another create", async () => {
  let createCalls = 0;
  let lookupCalls = 0;
  const existingOrder = {
    id: "pos-order-existing",
    externalOrderId: "NAKTA-existing-order",
    orderNumber: "14",
    status: "sent_to_kitchen",
    completed: false,
    progress: { itemsTotal: 1, itemsReady: 0, itemsRejected: 0 },
    items: [],
    createdAt: null,
    updatedAt: null,
  };
  const recovered = await createOrRecoverEduPosOrder({
    externalOrderId: existingOrder.externalOrderId,
    isRetry: true,
    create: async () => {
      createCalls += 1;
      return existingOrder;
    },
    lookup: async () => {
      lookupCalls += 1;
      return existingOrder;
    },
  });

  assert.equal(recovered.id, existingOrder.id);
  assert.equal(lookupCalls, 1);
  assert.equal(createCalls, 0);
});

test("EDU POS retries still create when lookup has a temporary database failure", async () => {
  let createCalls = 0;
  let lookupCalls = 0;
  const createdOrder = {
    id: "pos-order-created-after-lookup-failure",
    externalOrderId: "NAKTA-retry-after-lookup-failure",
    orderNumber: "15",
    status: "sent_to_kitchen",
    completed: false,
    progress: { itemsTotal: 1, itemsReady: 0, itemsRejected: 0 },
    items: [],
    createdAt: null,
    updatedAt: null,
  };
  const recovered = await createOrRecoverEduPosOrder({
    externalOrderId: createdOrder.externalOrderId,
    isRetry: true,
    create: async () => {
      createCalls += 1;
      return createdOrder;
    },
    lookup: async () => {
      lookupCalls += 1;
      throw new EduPosApiError(500, "Ошибка базы данных");
    },
  });

  assert.equal(recovered.id, createdOrder.id);
  assert.equal(lookupCalls, 1);
  assert.equal(createCalls, 1);
});

test("EDU POS menu export preserves products, availability and modifiers", () => {
  const exported = buildEduPosMenuExportPayload(
    "otuz-adyr",
    "osh",
    [{
        id: 7,
        slug: "rolls",
        title: "Роллы",
        image: "/images/rolls.png",
        sortOrder: 1,
        products: [{
          id: 42,
          sourceId: 142,
          slug: "salmon-roll",
          name: "Ролл с лососем",
          description: "Описание",
          composition: "Лосось, рис",
          image: "/images/salmon-roll.png",
          price: 490,
          oldPrice: 550,
          available: true,
          posAvailable: true,
          posDishId: null,
          posSoldByWeight: false,
          weight: 240,
          sortOrder: 2,
          modifierGroups: [{
            id: "sauce",
            title: "Соус",
            selectionType: "single",
            required: true,
            items: [{ id: "soy", name: "Соевый", price: 25, image: "" }],
          }],
        }],
      }],
    new Date("2026-08-14T00:00:00.000Z"),
  );
  assert.equal(exported.regionSlug, "otuz-adyr");
  assert.equal(exported.menuSourceRegionSlug, "osh");
  assert.equal(exported.categories[0].products[0].id, "nakta-product-42");
  assert.equal(exported.categories[0].products[0].available, true);
  assert.equal(exported.categories[0].products[0].modifiers[0].maxSelections, 1);
  assert.equal(exported.categories[0].products[0].modifiers[0].items[0].available, true);
});

test("EDU POS menu export sends only valid integer weights", () => {
  assert.equal(normalizeEduPosWeightGrams(0.1), null);
  assert.equal(normalizeEduPosWeightGrams(0), null);
  assert.equal(normalizeEduPosWeightGrams(Number.NaN), null);
  assert.equal(normalizeEduPosWeightGrams(240), 240);
  assert.equal(normalizeEduPosWeightGrams(240.6), 241);
});

test("EDU POS mappings are backfilled into orders created before menu sync", () => {
  const items = [{
    productId: 42,
    posDishId: null,
    posVariantId: null,
    posWeightGrams: null,
  }, {
    productId: 43,
    posDishId: "existing-dish",
    posVariantId: null,
    posWeightGrams: null,
  }];
  const updated = backfillOrderItemMappings(items, [{
    id: 42,
    posDishId: "nakta-product-42",
    posVariantId: "portion-large",
    posSoldByWeight: true,
    weight: 240.6,
  }, {
    id: 43,
    posDishId: "replacement-must-not-overwrite",
    posVariantId: null,
    posSoldByWeight: false,
    weight: 0,
  }]);

  assert.equal(updated.length, 1);
  assert.deepEqual(items[0], {
    productId: 42,
    posDishId: "nakta-product-42",
    posVariantId: "portion-large",
    posWeightGrams: 241,
  });
  assert.equal(items[1].posDishId, "existing-dish");
});

test("public orders controller does not expose an order-details endpoint", () => {
  assert.deepEqual(
    Object.getOwnPropertyNames(OrdersController.prototype).sort(),
    ["constructor", "create"],
  );
});

test("generated backend seed mirrors the current frontend catalog", () => {
  assert.equal(seedCategories.length, 17);
  assert.equal(seedCategories.reduce((count, category) => count + category.products.length, 0), 118);
  assert.ok(seedCategories.some((category) =>
    category.products.some((entry) => entry.modifierGroups.length > 0)));
  const products = seedCategories.flatMap((category) => category.products);
  const fries = products.find((product) => product.name === "Картофель фри");
  const customSet = products.find((product) => product.name === "Собери свой сет");
  const friesExtraSauce = fries?.modifierGroups.find((group) => group.id === "extra-sauce");
  assert.ok(fries?.modifierGroups.every((group) =>
    group.presentation === "rows" && group.priceScope === "per-line"));
  assert.equal(friesExtraSauce?.maxSelections, 99);
  assert.ok(friesExtraSauce?.items.every((item) => item.maxQuantity === 99));
  assert.equal(customSet?.modifierGroups.length, 4);
  assert.ok(customSet?.modifierGroups.every((group) =>
    group.presentation === "rows"
    && group.required
    && group.priceScope === "per-line"
    && group.items.length === 14
    && group.items.every((item) => item.maxQuantity === 1)));
});
