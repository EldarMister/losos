require("reflect-metadata");
const assert = require("node:assert/strict");
const test = require("node:test");
const { NotFoundException, RequestMethod } = require("@nestjs/common");
const { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } = require("@nestjs/common/constants");
const { AdminController } = require("../dist/admin/admin.controller");
const { AdminService } = require("../dist/admin/admin.service");
const { AdminTokenGuard } = require("../dist/admin/admin-token.guard");
const { CatalogService } = require("../dist/catalog/catalog.service");
const { Promotion } = require("../dist/catalog/promotion.entity");
const { Region } = require("../dist/catalog/region.entity");

test("promotion deletion removes the record permanently and preserves other promotions", async () => {
  const entries = [{ id: 1 }, { id: 2 }];
  const promotions = {
    findOne: async ({ where }) => entries.find((entry) => entry.id === where.id) ?? null,
    remove: async (promotion) => {
      entries.splice(entries.findIndex((entry) => entry.id === promotion.id), 1);
      return promotion;
    },
  };
  const service = new AdminService(undefined, undefined, undefined, undefined, promotions);

  assert.deepEqual(await service.deletePromotion(1), { deleted: true });
  assert.deepEqual(entries, [{ id: 2 }]);
  await assert.rejects(service.deletePromotion(1), NotFoundException);
  assert.deepEqual(entries, [{ id: 2 }]);
});

test("permanent promotion deletion is an authenticated admin DELETE endpoint", () => {
  assert.equal(Reflect.getMetadata(PATH_METADATA, AdminController.prototype.deletePromotion), "promotions/:id");
  assert.equal(Reflect.getMetadata(METHOD_METADATA, AdminController.prototype.deletePromotion), RequestMethod.DELETE);
  assert.ok(Reflect.getMetadata(GUARDS_METADATA, AdminController).includes(AdminTokenGuard));
});

test("startup does not recreate promotions deleted from existing regions, even when none remain", async () => {
  const previousSeedSetting = process.env.SEED_CATALOG_ON_STARTUP;
  process.env.SEED_CATALOG_ON_STARTUP = "true";
  let promotionWrites = 0;
  const regions = { findOne: async ({ where }) => ({ id: 1, slug: where.slug }) };
  const promotions = { save: async () => { promotionWrites += 1; } };
  const manager = {
    query: async () => [],
    getRepository: (entity) => entity === Region ? regions : entity === Promotion ? promotions : {},
  };
  const regionRepository = { manager: { transaction: async (run) => run(manager) } };
  const catalog = new CatalogService(regionRepository, undefined, undefined, promotions);
  try {
    await catalog.onModuleInit();
    assert.equal(promotionWrites, 0);
  } finally {
    if (previousSeedSetting === undefined) delete process.env.SEED_CATALOG_ON_STARTUP;
    else process.env.SEED_CATALOG_ON_STARTUP = previousSeedSetting;
  }
});
