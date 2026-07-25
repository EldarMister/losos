import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import {
  CreateProductDto,
  CreatePromotionDto,
} from "../src/admin/admin.dto";
import { seedCategories } from "../src/catalog/seed-data";
import type { ProductModifierGroup } from "../src/catalog/product.entity";
import { CreateOrderDto } from "../src/orders/create-order.dto";
import { OrdersController } from "../src/orders/orders.controller";
import {
  canTransitionOrderStatus,
  OrderStatus,
} from "../src/orders/order.enums";
import { priceOrderLine } from "../src/orders/order-pricing";

const baseOrder = {
  idempotencyKey: "order-test-0001",
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

  const excessiveModifierQuantity = plainToInstance(CreateOrderDto, {
    ...baseOrder,
    items: [{
      productId: 1,
      quantity: 1,
      modifiers: [{ groupId: "sauce", itemId: "cheese", quantity: 21 }],
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

test("server pricing validates modifier rules and snapshots quantity arithmetic", () => {
  const line = priceOrderLine(product, 2, [
    { groupId: "sauce", itemId: "cheese", quantity: 1 },
    { groupId: "extras", itemId: "ginger", quantity: 3 },
    { groupId: "extras", itemId: "wasabi", quantity: 2 },
  ]);

  assert.equal(line.basePrice, 100);
  assert.equal(line.modifiersPrice, 49);
  assert.equal(line.unitPrice, 149);
  assert.equal(line.lineTotal, 298);
  assert.deepEqual(
    line.modifierSnapshots.map(({ itemId, quantity, totalPrice }) => ({ itemId, quantity, totalPrice })),
    [
      { itemId: "cheese", quantity: 1, totalPrice: 20 },
      { itemId: "ginger", quantity: 3, totalPrice: 15 },
      { itemId: "wasabi", quantity: 2, totalPrice: 14 },
    ],
  );

  assert.throws(() => priceOrderLine(product, 1, []), /Select at least 1/);
  assert.throws(() => priceOrderLine(product, 1, [
    { groupId: "sauce", itemId: "cheese", quantity: 2 },
  ]), /must have quantity 1/);
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

  const manyExtras = {
    ...product,
    modifierGroups: [{
      id: "many",
      title: "Много добавок",
      selectionType: "multiple" as const,
      required: false,
      maxSelections: 3,
      items: ["one", "two", "three"].map((id) => ({
        id,
        name: id,
        price: 1,
        image: "",
        enabled: true,
      })),
    }],
  };
  assert.throws(() => priceOrderLine(manyExtras, 1, [
    { groupId: "many", itemId: "one", quantity: 20 },
    { groupId: "many", itemId: "two", quantity: 20 },
    { groupId: "many", itemId: "three", quantity: 20 },
  ]), /cannot exceed 50/);
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
      items: [{ id: "item", name: "Добавка", price: -1, image: "" }],
    }],
  });
  assert.ok(validateSync(invalid).some((error) => error.property === "modifierGroups"));
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
  assert.equal(seedCategories.length, 16);
  assert.equal(seedCategories.reduce((count, category) => count + category.products.length, 0), 114);
  assert.ok(seedCategories.some((category) =>
    category.products.some((entry) => entry.modifierGroups.length > 0)));
  const products = seedCategories.flatMap((category) => category.products);
  const fries = products.find((product) => product.name === "Картофель фри");
  const customSet = products.find((product) => product.name === "Собери свой сет");
  assert.ok(fries?.modifierGroups.every((group) => group.presentation === "rows"));
  assert.equal(customSet?.modifierGroups.length, 4);
  assert.ok(customSet?.modifierGroups.every((group) =>
    group.presentation === "cards" && group.required && group.items.length === 6));
});
