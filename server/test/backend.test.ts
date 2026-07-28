import "reflect-metadata";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { ConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import {
  CreateProductDto,
  CreatePromotionDto,
  UpdateProductDto,
} from "../src/admin/admin.dto";
import {
  CheckWhatsappAuthDto,
  RequestPhoneCodeDto,
  VerifyPhoneCodeDto,
} from "../src/auth/phone-auth.dto";
import { PhoneAuthController } from "../src/auth/phone-auth.controller";
import {
  extractWhatsappAuthCode,
  PhoneAuthService,
} from "../src/auth/phone-auth.service";
import type { PhoneAuthChallenge } from "../src/auth/phone-auth.entity";
import { WhatsappCloudService } from "../src/auth/whatsapp-cloud.service";
import { assertValidModifierGroups } from "../src/catalog/modifier-validation";
import { seedCategories } from "../src/catalog/seed-data";
import type { ProductModifierGroup } from "../src/catalog/product.entity";
import { POSTGRES_INTEGER_MAX } from "../src/common/numeric-limits";
import { CreateOrderDto } from "../src/orders/create-order.dto";
import { OrdersController } from "../src/orders/orders.controller";
import {
  canTransitionOrderStatus,
  OrderStatus,
} from "../src/orders/order.enums";
import { priceOrderLine } from "../src/orders/order-pricing";

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

test("phone auth DTO normalizes supported numbers and requires a six-digit code", () => {
  const request = plainToInstance(RequestPhoneCodeDto, { phone: "+996 (555) 123-456" });
  assert.deepEqual(validateSync(request), []);
  assert.equal(request.phone, "+996555123456");

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
      "checkWhatsapp",
      "constructor",
      "methods",
      "receiveWhatsappWebhook",
      "requestCode",
      "requestWhatsapp",
      "verifyCode",
      "verifyWhatsappWebhook",
    ],
  );
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
