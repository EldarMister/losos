const assert = require("node:assert/strict");
const { NestFactory } = require("@nestjs/core");
const { DataSource, Like } = require("typeorm");
const { AppModule } = require("../dist/app.module");
const { AdminService } = require("../dist/admin/admin.service");
const { CatalogService } = require("../dist/catalog/catalog.service");
const { Product } = require("../dist/catalog/product.entity");
const { Order } = require("../dist/orders/order.entity");
const { OrderStatus } = require("../dist/orders/order.enums");
const { OrdersService } = require("../dist/orders/orders.service");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
  if (!/test/i.test(databaseName) && process.env.ALLOW_INTEGRATION_DB !== "true") {
    throw new Error("Refusing to run against a non-test database; set ALLOW_INTEGRATION_DB=true to override");
  }

  process.env.NODE_ENV = "production";
  process.env.DB_SYNCHRONIZE = "false";
  process.env.SEED_CATALOG_ON_STARTUP = "true";
  const application = await NestFactory.createApplicationContext(AppModule, { logger: false });

  try {
    const dataSource = application.get(DataSource);
    const orderRepository = dataSource.getRepository(Order);
    await orderRepository.delete({ idempotencyKey: Like("integration-%") });

    const product = await dataSource.getRepository(Product).findOne({
      where: {
        sourceId: 11152,
        category: { region: { slug: "bishkek" } },
      },
      relations: { category: { region: true } },
    });
    assert.ok(product, "seeded configurable product must exist");

    const orders = application.get(OrdersService);
    const basePayload = {
      idempotencyKey: "integration-order-0001",
      regionSlug: "bishkek",
      deliveryType: "delivery",
      customerName: "Integration Test",
      phone: "+996555123456",
      address: "Bishkek integration address",
      latitude: 42.8746,
      longitude: 74.5698,
      apartment: "10",
      entrance: "2",
      floor: "4",
      intercom: "10",
      comment: "integration",
      paymentMethod: "cash",
      utensilsCount: 2,
      noUtensils: false,
      items: [{
        productId: product.id,
        quantity: 2,
        modifiers: [
          { groupId: "fries-sauce", itemId: "cheese", quantity: 1 },
          { groupId: "extra-sauce", itemId: "sweet-chili", quantity: 3 },
          { groupId: "extra-sauce", itemId: "caesar", quantity: 2 },
        ],
      }],
    };

    const created = await orders.create(basePayload);
    assert.equal(created.total, 1870);
    assert.equal(created.items.length, 1);
    assert.equal(created.latitude, basePayload.latitude);
    assert.equal(created.longitude, basePayload.longitude);
    assert.equal(created.items[0].modifierSnapshots[1].quantity, 3);
    assert.equal(created.items[0].modifierSnapshots[1].totalPrice, 300);

    const retried = await orders.create(basePayload);
    assert.equal(retried.id, created.id, "same idempotency key and payload must return the same order");
    await assert.rejects(
      orders.create({ ...basePayload, comment: "different payload" }),
      /Idempotency key was already used/,
    );
    await assert.rejects(
      orders.create({ ...basePayload, longitude: 74.58 }),
      /Idempotency key was already used/,
    );

    const twoConfigurations = await orders.create({
      ...basePayload,
      idempotencyKey: "integration-order-0002",
      items: [
        { ...basePayload.items[0], quantity: 1 },
        {
          productId: product.id,
          quantity: 1,
          modifiers: [
            { groupId: "fries-sauce", itemId: "cheese", quantity: 1 },
            { groupId: "extra-sauce", itemId: "sweet-chili", quantity: 2 },
          ],
        },
      ],
    });
    assert.equal(twoConfigurations.items.length, 2);
    assert.notEqual(
      twoConfigurations.items[0].configurationKey,
      twoConfigurations.items[1].configurationKey,
    );

    await assert.rejects(
      orders.create({
        ...basePayload,
        idempotencyKey: "integration-order-0003",
        items: [{ productId: product.id, quantity: 1, modifiers: [] }],
      }),
      /Select at least 1/,
    );

    const admin = application.get(AdminService);
    const confirmed = await admin.updateOrderStatus(created.id, OrderStatus.CONFIRMED);
    assert.equal(confirmed.status, OrderStatus.CONFIRMED);
    const listed = await admin.orders({ regionSlug: "bishkek", limit: 100, offset: 0 });
    const listedOrder = listed.items.find((order) => order.id === created.id);
    assert.ok(listedOrder);
    assert.equal(listedOrder.latitude, basePayload.latitude);
    assert.equal(listedOrder.longitude, basePayload.longitude);

    const productRepository = dataSource.getRepository(Product);
    const originalPrice = product.price;
    product.price = originalPrice + 1;
    await productRepository.save(product);
    await application.get(CatalogService).onModuleInit();
    const preservedProduct = await productRepository.findOneByOrFail({ id: product.id });
    assert.equal(preservedProduct.price, originalPrice + 1, "seed must not overwrite admin changes");
    preservedProduct.price = originalPrice;
    await productRepository.save(preservedProduct);

    console.log(JSON.stringify({
      migrations: await dataSource.query(`SELECT count(*)::int AS count FROM "migrations"`),
      regions: await dataSource.getRepository("Region").count(),
      categories: await dataSource.getRepository("Category").count(),
      products: await dataSource.getRepository(Product).count(),
      orderTotal: created.total,
      modifierSnapshotCount: created.items[0].modifierSnapshots.length,
      distinctConfigurationLines: twoConfigurations.items.length,
      idempotentRetry: retried.id === created.id,
      adminStatus: confirmed.status,
      adminCoordinates: [listedOrder.latitude, listedOrder.longitude],
      seedPreservedAdminPrice: true,
    }, null, 2));
  } finally {
    const dataSource = application.get(DataSource);
    await dataSource.getRepository(Order).delete({ idempotencyKey: Like("integration-%") });
    await application.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
