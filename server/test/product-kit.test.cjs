require("reflect-metadata");
const assert = require("node:assert/strict");
const test = require("node:test");
const { plainToInstance } = require("class-transformer");
const { AdminService } = require("../dist/admin/admin.service");
const { Product } = require("../dist/catalog/product.entity");
const { Region } = require("../dist/catalog/region.entity");
const { CatalogService } = require("../dist/catalog/catalog.service");
const { CreateOrderDto } = require("../dist/orders/create-order.dto");
const { Order } = require("../dist/orders/order.entity");
const { OrderItem } = require("../dist/orders/order-item.entity");
const { OrderStatus } = require("../dist/orders/order.enums");
const { OrdersService, fingerprintRequest } = require("../dist/orders/orders.service");

const baseOrder = {
  idempotencyKey: "order-test-0001",
  verificationToken: "a".repeat(64),
  regionSlug: "bishkek",
  deliveryType: "delivery",
  customerName: "Тест",
  phone: "+996555123456",
  address: "Бишкек",
  paymentMethod: "cash",
  items: [{ productId: 1, quantity: 1, modifiers: [] }],
};

test("enabled regions publish the shared menu kit catalog even when its source region is disabled", async () => {
  const kitCatalog = [{ id: "custom-ginger", name: "Имбирь ресторана", image: "", defaultQuantity: 1, enabled: true }];
  const destination = { slug: "otuz-adyr", enabled: true, menuSourceRegionSlug: "osh", freeKitItems: [] };
  const source = { slug: "osh", enabled: false, freeKitItems: kitCatalog };
  const repository = {
    find: async () => [destination],
    findOne: async ({ where }) => where.slug === "osh" && where.enabled === undefined ? source : null,
  };
  const service = new CatalogService(repository, {}, {}, {});
  const regions = await service.regions();
  assert.equal(regions.length, 1);
  assert.deepEqual(regions[0].kitCatalog, kitCatalog);
});

test("order creation derives its kit from source-menu dishes and saves full included limits", async () => {
  const region = { slug: "bishkek", menuSourceRegionSlug: "osh", enabled: true, deliveryIs24Hours: true, freeKitItems: [] };
  const menuRegion = { slug: "osh", freeKitItems: null };
  const dishes = [
    { id: 1, name: "Ролл", price: 100, available: true, modifierGroups: [], category: { region: menuRegion }, kitItems: [{ id: "soy-sauce", quantity: 2 }, { id: "wasabi", quantity: 1 }] },
    { id: 2, name: "Пицца", price: 200, available: true, modifierGroups: [], category: { region: menuRegion }, kitItems: [] },
  ];
  let saved;
  let consumed = 0;
  const orderRepository = {
    findOne: async ({ where }) => saved?.idempotencyKey === where.idempotencyKey ? saved : null,
    create: (data) => ({ ...data, id: "order-kit-test", orderNumber: 1 }),
    save: async (data) => { saved = data; return data; },
  };
  const manager = {
    getRepository: (entity) => {
      if (entity === Order) return orderRepository;
      if (entity === OrderItem) return { create: (data) => data };
      if (entity === Product) return { find: async () => dishes };
      if (entity === Region) return { findOne: async () => region };
      throw new Error("Unexpected repository");
    },
  };
  const repository = { ...orderRepository, manager: { ...manager, transaction: async (run) => run(manager) } };
  const service = new OrdersService(
    repository,
    { consumeVerification: async () => { consumed += 1; } },
    { assertProductsOrderable: () => undefined },
  );
  const dto = plainToInstance(CreateOrderDto, {
    ...baseOrder,
    items: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 3 }],
    kitItems: [{ id: "soy-sauce", quantity: 2 }, { id: "wasabi", quantity: 0 }],
  });
  const created = await service.create(dto);
  assert.deepEqual(saved.kitItems, [
    { id: "soy-sauce", name: "Соус соевый", quantity: 2 },
    { id: "wasabi", name: "Васаби", quantity: 0 },
  ]);
  assert.deepEqual(saved.includedKitItems, [
    { id: "soy-sauce", name: "Соус соевый", quantity: 4 },
    { id: "wasabi", name: "Васаби", quantity: 2 },
  ]);
  dishes[0].kitItems = [];
  assert.equal((await service.create(dto)).id, created.id, "retry survives a later dish kit edit");
  assert.equal(consumed, 1, "retry does not consume verification twice");
  await assert.rejects(() => service.create(plainToInstance(CreateOrderDto, { ...dto, kitItems: [{ id: "soy-sauce", quantity: 3 }] })), /Idempotency key/);
  saved = undefined;
  dishes.pop();
  await service.create(plainToInstance(CreateOrderDto, { ...baseOrder, idempotencyKey: "order-without-kit" }));
  assert.deepEqual(saved.kitItems, []);
  assert.deepEqual(saved.includedKitItems, []);
  saved = undefined;
  await assert.rejects(() => service.create(plainToInstance(CreateOrderDto, { ...baseOrder, idempotencyKey: "order-forged-kit", kitItems: [{ id: "soy-sauce", quantity: 1 }] })), /Неизвестная комплектующая/);
});

test("kit fingerprints sort ids and preserve defaults versus explicit reductions", () => {
  const dto = plainToInstance(CreateOrderDto, baseOrder);
  const first = [{ id: "soy-sauce", quantity: 2 }, { id: "wasabi", quantity: 0 }];
  assert.equal(fingerprintRequest({ ...dto, kitItems: first }), fingerprintRequest({ ...dto, kitItems: [...first].reverse() }));
  assert.notEqual(fingerprintRequest(dto), fingerprintRequest({ ...dto, kitItems: first }));
});

test("orders using the legacy resolved-kit fingerprint can still be retried", async () => {
  const dto = plainToInstance(CreateOrderDto, baseOrder);
  const includedKitItems = [{ id: "soy-sauce", name: "Соус соевый", quantity: 2 }];
  const order = {
    id: "legacy-kit-order",
    orderNumber: 3,
    total: 100,
    requestFingerprint: fingerprintRequest(dto, includedKitItems),
    kitItems: includedKitItems,
    includedKitItems,
  };
  const service = new OrdersService({ findOne: async () => order }, {}, {});
  assert.equal((await service.create(dto)).id, order.id);
  await assert.rejects(() => service.create({ ...dto, kitItems: [{ id: "soy-sauce", quantity: 1 }] }), /Idempotency key/);
});

test("explicit legacy retries survive an administrator reducing the kit before migration", async () => {
  const dto = plainToInstance(CreateOrderDto, { ...baseOrder, kitItems: [{ id: "soy-sauce", quantity: 2 }] });
  const originalKit = [{ id: "soy-sauce", name: "Соус соевый", quantity: 2 }];
  const reducedKit = [{ ...originalKit[0], quantity: 0 }];
  const order = {
    id: "legacy-reduced-kit-order",
    requestFingerprint: fingerprintRequest(dto, originalKit),
    kitItems: reducedKit,
    includedKitItems: reducedKit,
  };
  const service = new OrdersService({ findOne: async () => order }, {}, {});
  assert.equal((await service.create(dto)).id, order.id);
  assert.equal(order.kitItems[0].quantity, 0, "retry returns the existing order without restoring its kit");
  await assert.rejects(() => service.create({ ...dto, kitItems: [{ id: "soy-sauce", quantity: 1 }] }), /Idempotency key/);
});

test("legacy retries without kit selections can reconstruct known defaults after a reduction", async () => {
  const dto = plainToInstance(CreateOrderDto, baseOrder);
  const originalKit = [
    { id: "soy-sauce", name: "Соус соевый", quantity: 2 },
    { id: "wasabi", name: "Васаби", quantity: 1 },
    { id: "pickled-ginger", name: "Имбирь", quantity: 1 },
  ];
  const reducedKit = originalKit.map((item) => ({ ...item, quantity: 0 }));
  const order = {
    id: "legacy-default-kit-order",
    requestFingerprint: fingerprintRequest(dto, originalKit),
    kitItems: reducedKit,
    includedKitItems: reducedKit,
  };
  const service = new OrdersService({ findOne: async () => order }, {}, {});
  assert.equal((await service.create(dto)).id, order.id);
  assert.deepEqual(order.kitItems.map((item) => item.quantity), [0, 0, 0], "retry leaves the administrator's reductions intact");
  await assert.rejects(() => service.create({ ...dto, address: "Другой адрес" }), /Idempotency key/);
});

test("admin kit reductions can restore saved included limits without consulting changed dishes", async () => {
  const includedKitItems = [{ id: "soy-sauce", name: "Соус соевый", quantity: 4 }];
  const order = { id: "kit-order", status: OrderStatus.NEW, noUtensils: false, utensilsCount: 1, items: [], kitItems: [{ ...includedKitItems[0], quantity: 0 }], includedKitItems };
  const service = new AdminService(
    {}, {}, {}, {}, {},
    { findOne: async () => order, save: async (value) => value },
    {}, {},
  );
  const updated = await service.updateOrderKit(order.id, { noUtensils: false, utensilsCount: 2, kitItems: [{ id: "soy-sauce", quantity: 4 }] });
  assert.equal(updated.kitItems[0].quantity, 4);
  assert.equal(updated.includedKitItems[0].quantity, 4);
  await assert.rejects(() => service.updateOrderKit(order.id, { noUtensils: false, utensilsCount: 2, kitItems: [{ id: "soy-sauce", quantity: 5 }] }), /превышает/);
});
