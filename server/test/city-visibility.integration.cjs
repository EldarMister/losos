require("reflect-metadata");
const assert = require("node:assert/strict");
const test = require("node:test");
const { plainToInstance } = require("class-transformer");
const { validateSync } = require("class-validator");
const { AdminService } = require("../dist/admin/admin.service");
const { CatalogService } = require("../dist/catalog/catalog.service");
const { UpdateRegionDto } = require("../dist/admin/admin.dto");

test("admin can hide a city from both clients and show it again without deleting settings", async () => {
  const cities = [
    { id: 1, slug: "bishkek", name: "Бишкек", enabled: true, pickupLocations: [] },
    { id: 2, slug: "osh", name: "Ош", enabled: true, pickupLocations: [] },
    { id: 3, slug: "otuz-adyr", name: "Отуз-Адыр", enabled: true, pickupLocations: [] },
    { id: 4, slug: "extra", name: "Лишний город", enabled: true, contactPhone: "+996555123456", pickupLocations: [] },
  ];
  const repository = {
    find: async ({ where }) => cities.filter((city) => !where || Object.entries(where).every(([key, value]) => city[key] === value)),
    findOne: async ({ where }) => {
      const city = cities.find((city) => Object.entries(where).every(([key, value]) => city[key] === value));
      return city ? { ...city } : null;
    },
    save: async (updated) => {
      const index = cities.findIndex((city) => city.id === updated.id);
      cities[index] = { ...cities[index], ...Object.fromEntries(Object.entries(updated).filter(([, value]) => value !== undefined)) };
      return cities[index];
    },
  };
  const admin = Object.assign(Object.create(AdminService.prototype), { regions: repository });
  const catalog = Object.assign(Object.create(CatalogService.prototype), { regionRepository: repository });
  const hide = plainToInstance(UpdateRegionDto, { enabled: false });
  assert.deepEqual(validateSync(hide), []);

  await admin.updateRegion(4, hide);
  assert.deepEqual((await catalog.regions()).map((city) => city.slug), ["bishkek", "osh", "otuz-adyr"]);
  await assert.rejects(catalog.requireRegion("extra"), /Region not found/);
  const hidden = (await admin.settings()).find((city) => city.slug === "extra");
  assert.equal(hidden.enabled, false);
  assert.equal(hidden.contactPhone, "+996555123456");
  assert.equal(cities.length, 4);

  await admin.updateRegion(4, plainToInstance(UpdateRegionDto, { enabled: true }));
  assert.equal((await catalog.requireRegion("extra")).enabled, true);
  assert.equal((await catalog.regions()).length, 4);
});
