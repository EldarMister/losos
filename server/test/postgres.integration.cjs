const assert = require("node:assert/strict");
const { NestFactory } = require("@nestjs/core");
const { DataSource, Like } = require("typeorm");
const { AppModule } = require("../dist/app.module");
const { AdminService } = require("../dist/admin/admin.service");
const { CatalogService } = require("../dist/catalog/catalog.service");
const { Product } = require("../dist/catalog/product.entity");
const { Promotion } = require("../dist/catalog/promotion.entity");
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
  let productBackup = null;
  let adminProductId = null;
  let staleProductId = null;
  let adminPromotionId = null;
  const artifactPromotionIds = [];
  const promotionBackups = [];

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
    assert.equal(product.price, 275, "fries fixture price changed");
    productBackup = {
      id: product.id,
      price: product.price,
      modifierGroups: structuredClone(product.modifierGroups),
    };
    product.modifierGroups = [
      {
        id: "fries-sauce",
        title: "Основной соус",
        selectionType: "single",
        required: true,
        minSelections: 1,
        maxSelections: 1,
        priceScope: "per-line",
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
        selectionType: "multiple",
        required: false,
        minSelections: 0,
        maxSelections: 1,
        priceScope: "per-line",
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
    ];
    await dataSource.getRepository(Product).save(product);

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
        ],
      }],
    };

    const created = await orders.create(basePayload);
    assert.equal(created.total, 850);
    assert.equal(created.items.length, 1);
    assert.equal(created.latitude, basePayload.latitude);
    assert.equal(created.longitude, basePayload.longitude);
    assert.equal(created.items[0].modifierSnapshots[1].quantity, 3);
    assert.equal(created.items[0].modifierSnapshots[1].totalPrice, 300);
    assert.equal(created.items[0].modifierSnapshots[1].priceScope, "per-line");
    assert.equal(created.items[0].baseTotal, 550);
    assert.equal(created.items[0].modifiersTotal, 300);
    assert.equal(created.items[0].unitPrice, 275);
    assert.equal(created.items[0].pricingVersion, "scoped-v2");

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
    await assert.rejects(
      orders.create({
        ...basePayload,
        idempotencyKey: "integration-order-0004",
        items: [{
          productId: product.id,
          quantity: 1,
          modifiers: [
            { groupId: "fries-sauce", itemId: "cheese", quantity: 1 },
            { groupId: "extra-sauce", itemId: "sweet-chili", quantity: 1 },
            { groupId: "extra-sauce", itemId: "caesar", quantity: 1 },
          ],
        }],
      }),
      /Select no more than 1/,
    );

    const admin = application.get(AdminService);
    const confirmed = await admin.updateOrderStatus(created.id, OrderStatus.CONFIRMED);
    assert.equal(confirmed.status, OrderStatus.CONFIRMED);
    const listed = await admin.orders({ regionSlug: "bishkek", limit: 100, offset: 0 });
    const listedOrder = listed.items.find((order) => order.id === created.id);
    assert.ok(listedOrder);
    assert.equal(listedOrder.latitude, basePayload.latitude);
    assert.equal(listedOrder.longitude, basePayload.longitude);

    await dataSource.undoLastMigration();
    await dataSource.query(
      `UPDATE "products" SET "modifierGroups" = $1::jsonb WHERE "id" = $2`,
      [JSON.stringify([
        {
          id: "legacy-single",
          title: "Legacy single",
          selectionType: "single",
          required: false,
          items: [{ id: "one", name: "One", price: 0, image: "" }],
        },
        {
          id: "legacy-multiple",
          title: "Legacy multiple",
          selectionType: "multiple",
          required: false,
          items: [{ id: "many", name: "Many", price: 100, image: "" }],
        },
      ]), product.id],
    );
    await dataSource.query(
      `
        UPDATE "order_items"
        SET
          "modifiersPrice" = 100,
          "unitPrice" = 375,
          "lineTotal" = 750,
          "modifierSnapshots" = $1::jsonb
        WHERE "id" = $2
      `,
      [JSON.stringify([{
        groupId: "legacy-multiple",
        groupTitle: "Legacy multiple",
        itemId: "many",
        itemName: "Many",
        price: 100,
        quantity: 1,
        totalPrice: 100,
      }]), created.items[0].id],
    );
    await dataSource.runMigrations();
    const [migratedProduct] = await dataSource.query(
      `SELECT "modifierGroups" FROM "products" WHERE "id" = $1`,
      [product.id],
    );
    assert.equal(migratedProduct.modifierGroups[0].priceScope, "per-product");
    assert.equal(migratedProduct.modifierGroups[0].items[0].maxQuantity, 1);
    assert.equal(migratedProduct.modifierGroups[1].items[0].maxQuantity, 20);
    const [migratedOrderItem] = await dataSource.query(
      `
        SELECT
          "baseTotal",
          "modifiersTotal",
          "pricingVersion",
          "modifierSnapshots"
        FROM "order_items"
        WHERE "id" = $1
      `,
      [created.items[0].id],
    );
    assert.equal(migratedOrderItem.baseTotal, 550);
    assert.equal(migratedOrderItem.modifiersTotal, 200);
    assert.equal(migratedOrderItem.pricingVersion, "legacy-per-product");
    assert.equal(
      migratedOrderItem.modifierSnapshots[0].priceScope,
      "per-product",
    );

    const productRepository = dataSource.getRepository(Product);
    const originalPrice = productBackup.price;
    const originalCategory = {
      id: product.category.id,
      title: product.category.title,
      sortOrder: product.category.sortOrder,
    };
    const novinkiCategory = await dataSource.getRepository("Category").findOne({
      where: {
        slug: "novinki",
        region: { id: product.category.region.id },
      },
      relations: { region: true },
    });
    assert.ok(novinkiCategory);
    const staleSeededProduct = await productRepository.save(productRepository.create({
      sourceId: 11693,
      slug: "zelenyj-stale-novinki",
      name: "Зелёный",
      price: 590,
      image: "https://example.com/stale.webp",
      description: "",
      composition: "",
      weight: 0,
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      isNew: true,
      modifierGroups: [],
      available: true,
      sortOrder: 999,
      category: novinkiCategory,
    }));
    staleProductId = staleSeededProduct.id;
    const adminProduct = await productRepository.save(productRepository.create({
      sourceId: null,
      slug: "integration-admin-product",
      name: "Integration admin product",
      price: 777,
      image: "https://example.com/admin.webp",
      description: "",
      composition: "",
      weight: 0,
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      isNew: false,
      modifierGroups: [],
      available: true,
      sortOrder: 999,
      category: novinkiCategory,
    }));
    adminProductId = adminProduct.id;

    const promotionRepository = dataSource.getRepository(Promotion);
    const telegramPromotion = await promotionRepository.findOne({
      where: {
        title: "Telegram: промокоды и мемы",
        region: { id: product.category.region.id },
      },
      relations: { region: true },
    });
    const pleasurePromotion = await promotionRepository.findOne({
      where: {
        title: "Много лосося — удовольствие есть",
        region: { id: product.category.region.id },
      },
      relations: { region: true },
    });
    assert.ok(telegramPromotion);
    assert.ok(pleasurePromotion);
    for (const promotion of [telegramPromotion, pleasurePromotion]) {
      promotionBackups.push({
        id: promotion.id,
        title: promotion.title,
        image: promotion.image,
        cta: promotion.cta,
        ctaUrl: promotion.ctaUrl,
        enabled: promotion.enabled,
        sortOrder: promotion.sortOrder,
      });
      promotion.image = "https://example.com/stale-promo.webp";
      promotion.cta = "Старый CTA";
      promotion.ctaUrl = "https://example.com/stale";
      promotion.enabled = false;
      promotion.sortOrder = 99;
    }
    telegramPromotion.title = "Промокоды и подарки";
    pleasurePromotion.title = "Удовольствие есть";
    await promotionRepository.save([telegramPromotion, pleasurePromotion]);
    const artifactPromotions = await promotionRepository.save(
      [" Memories/TEST ", " TEST ", "  ТеСт  "].map((title, index) =>
        promotionRepository.create({
          title,
          image: "https://example.com/test.webp",
          cta: "Test",
          ctaUrl: "",
          enabled: true,
          sortOrder: 100 + index,
          region: product.category.region,
        })),
    );
    artifactPromotionIds.push(...artifactPromotions.map((promotion) => promotion.id));
    const adminPromotion = await promotionRepository.save(promotionRepository.create({
      title: "Admin campaign",
      image: "https://example.com/admin-promo.webp",
      cta: "Admin CTA",
      ctaUrl: "https://example.com/admin",
      enabled: false,
      sortOrder: 101,
      region: product.category.region,
    }));
    adminPromotionId = adminPromotion.id;

    product.price = originalPrice + 1;
    await productRepository.save(product);
    product.category.title = "Integration changed category";
    product.category.sortOrder = 999;
    await dataSource.getRepository("Category").save(product.category);
    const catalogService = application.get(CatalogService);
    await catalogService.onModuleInit();
    await catalogService.onModuleInit();
    const synchronizedProduct = await productRepository.findOneByOrFail({ id: product.id });
    assert.equal(synchronizedProduct.price, originalPrice, "seed product must be synchronized");
    assert.deepEqual(synchronizedProduct.modifierGroups, productBackup.modifierGroups);
    assert.equal(
      await productRepository.findOneBy({ id: staleSeededProduct.id }),
      null,
      "stale category-scoped seeded product must be removed",
    );
    const canonicalGreen = await productRepository.findOne({
      where: {
        sourceId: 11693,
        category: {
          slug: "salaty-3",
          region: { id: product.category.region.id },
        },
      },
    });
    assert.ok(canonicalGreen, "same sourceId in its canonical category must remain");
    const preservedAdminProduct = await productRepository.findOneByOrFail({ id: adminProduct.id });
    assert.equal(preservedAdminProduct.price, 777, "admin product must remain untouched");
    const synchronizedCategory = await dataSource.getRepository("Category").findOneByOrFail({
      id: originalCategory.id,
    });
    assert.equal(synchronizedCategory.title, originalCategory.title);
    assert.equal(synchronizedCategory.sortOrder, originalCategory.sortOrder);

    const reconciledPromotions = await promotionRepository.find({
      where: { region: { id: product.category.region.id } },
      order: { sortOrder: "ASC", id: "ASC" },
    });
    const canonicalPromotionDefinitions = [
      {
        title: "Скидка студентам",
        image: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/b92972a55683d636714fea75d11469ce_resize_in_box_2048_2048.png",
        cta: "Заполнить форму",
        ctaUrl: "",
      },
      {
        title: "Telegram: промокоды и мемы",
        image: "/reference-telegram-story.png",
        cta: "Подарки в студию!",
        ctaUrl: "https://t.me/mnogolososya",
      },
      {
        title: "Много лосося — удовольствие есть",
        image: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/19fb66365769d651613e33c969235601_resize_in_box_2048_2048.jpg",
        cta: "",
        ctaUrl: "",
      },
      {
        title: "Всё вкусное — детям!",
        image: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/2720f66e5f628289ea1c761222a24eb4_resize_in_box_2048_2048.jpg",
        cta: "Кавабанга!",
        ctaUrl: "",
      },
      {
        title: "Кешбэк до 100%",
        image: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/e258569da4e992205d8f3ae006d151eb_resize_in_box_2048_2048.jpg",
        cta: "",
        ctaUrl: "",
      },
      {
        title: "Мноооооого палочки?",
        image: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/1ebd0558c6daa570f029071ce7bb1648_resize_in_box_2048_2048.jpg",
        cta: "Хорошо",
        ctaUrl: "",
      },
      {
        title: "Помогаем котикам вместе",
        image: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/7c7596a0dba0e9fff9f96d6e65df547d_resize_in_box_2048_2048.jpg",
        cta: "Мяу!",
        ctaUrl: "",
      },
    ];
    for (const [sortOrder, definition] of canonicalPromotionDefinitions.entries()) {
      const matches = reconciledPromotions.filter((entry) =>
        entry.title === definition.title);
      assert.equal(matches.length, 1, `canonical promotion ${definition.title} must be unique`);
      const [promotion] = matches;
      assert.equal(promotion.sortOrder, sortOrder);
      assert.equal(promotion.enabled, true);
      assert.equal(promotion.image, definition.image);
      assert.equal(promotion.cta, definition.cta);
      assert.equal(promotion.ctaUrl, definition.ctaUrl);
    }
    assert.equal(
      reconciledPromotions.some((entry) =>
        ["Промокоды и подарки", "Удовольствие есть"].includes(entry.title)),
      false,
    );
    assert.equal(
      reconciledPromotions.some((entry) =>
        ["memories/test", "test", "тест"].includes(
          entry.title.trim().toLocaleLowerCase("ru-RU"),
        )),
      false,
    );
    const preservedAdminPromotion = reconciledPromotions.find((entry) =>
      entry.id === adminPromotion.id);
    assert.ok(preservedAdminPromotion);
    assert.equal(preservedAdminPromotion.title, "Admin campaign");
    assert.equal(preservedAdminPromotion.image, "https://example.com/admin-promo.webp");
    assert.equal(preservedAdminPromotion.cta, "Admin CTA");
    assert.equal(preservedAdminPromotion.ctaUrl, "https://example.com/admin");
    assert.equal(preservedAdminPromotion.enabled, false);
    assert.equal(preservedAdminPromotion.sortOrder, 101);

    const migrations = await dataSource.query(
      `SELECT count(*)::int AS count FROM "migrations"`,
    );
    assert.equal(migrations[0].count, 6);
    console.log(JSON.stringify({
      migrations,
      regions: await dataSource.getRepository("Region").count(),
      categories: await dataSource.getRepository("Category").count(),
      products: await dataSource.getRepository(Product).count(),
      orderTotal: created.total,
      modifierSnapshotCount: created.items[0].modifierSnapshots.length,
      distinctConfigurationLines: twoConfigurations.items.length,
      idempotentRetry: retried.id === created.id,
      adminStatus: confirmed.status,
      adminCoordinates: [listedOrder.latitude, listedOrder.longitude],
      seedSynchronizedCanonicalProduct: true,
      seedPreservedAdminProduct: true,
      staleSeededProductRemoved: true,
      canonicalPromotions: canonicalPromotionDefinitions.length,
      unknownAdminPromotionPreserved: true,
    }, null, 2));
  } finally {
    const dataSource = application.get(DataSource);
    await dataSource.getRepository(Order).delete({ idempotencyKey: Like("integration-%") });
    if (productBackup) {
      await dataSource.getRepository(Product).update(productBackup.id, {
        price: productBackup.price,
        modifierGroups: productBackup.modifierGroups,
      });
    }
    if (adminProductId !== null) {
      await dataSource.getRepository(Product).delete(adminProductId);
    }
    if (staleProductId !== null) {
      await dataSource.getRepository(Product).delete(staleProductId);
    }
    if (adminPromotionId !== null) {
      await dataSource.getRepository(Promotion).delete(adminPromotionId);
    }
    for (const artifactPromotionId of artifactPromotionIds) {
      await dataSource.getRepository(Promotion).delete(artifactPromotionId);
    }
    for (const backup of promotionBackups) {
      const { id, ...fields } = backup;
      await dataSource.getRepository(Promotion).update(id, fields);
    }
    await application.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
