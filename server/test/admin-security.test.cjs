const assert = require('node:assert/strict');
const test = require('node:test');
require('reflect-metadata');
const { ForbiddenException, UnauthorizedException } = require('@nestjs/common');
const { Reflector } = require('@nestjs/core');
const { AdminTokenGuard } = require('../dist/admin/admin-token.guard');
const { AdminController } = require('../dist/admin/admin.controller');
const { AdminStaffController } = require('../dist/admin/admin-security.controller');
const { AdminReportsController } = require('../dist/admin/admin-reports.module');
const { ADMIN_ACCESS, effectivePermissions, hasPermission, validateOverrides, assertProductFields, assertRegionFields } = require('../dist/admin/admin-permissions');
const { hashStaffPassword, verifyStaffPassword, assertOwnerSurvives, publicStaff } = require('../dist/admin/admin-security.service');
const { filterAdminDashboard, filterAdminRegion } = require('../dist/admin/admin-payload-access');
const staff = (role = 'MANAGER', permissions = {}) => ({ id: 'staff-id', login: 'staff', name: 'Сотрудник', role, active: true, permissions });

test('exact role defaults, view dependencies, overrides, and owner immunity', () => {
  const manager = staff();
  assert.deepEqual(effectivePermissions(manager).sort(), ['customers.edit', 'customers.view', 'orders.edit', 'orders.status', 'orders.view']);
  assert.equal(hasPermission(staff('ADMIN'), 'analytics.export'), true);
  assert.equal(hasPermission(staff('ADMIN'), 'staff.create'), false);
  assert.equal(hasPermission(staff('ADMIN', { 'orders.view': 'deny' }), 'orders.status'), false);
  assert.equal(hasPermission(staff('MANAGER', { 'analytics.view': 'allow', 'analytics.export': 'allow' }), 'analytics.export'), true);
  assert.equal(hasPermission(staff('OWNER', { 'orders.view': 'deny' }), 'orders.view'), true);
  assert.deepEqual(effectivePermissions({ ...staff('OWNER'), active: false }), []);
  assert.deepEqual(validateOverrides({ 'orders.view': 'inherit', 'orders.edit': 'deny' }), { 'orders.edit': 'deny' });
  assert.throws(() => validateOverrides({ 'role': 'allow' }));
  assert.throws(() => validateOverrides({ 'orders.view': true }));
});

test('every existing business endpoint and staff endpoint declares access policy', () => {
  for (const type of [AdminController, AdminStaffController, AdminReportsController]) {
    for (const name of Object.getOwnPropertyNames(type.prototype).filter(name => name !== 'constructor')) {
      assert.ok(Reflect.getMetadata(ADMIN_ACCESS, type.prototype[name]), `${type.name}.${name} must explicitly declare access`);
    }
  }
});

test('guard rereads identity on every call and denies legacy token / unconfigured routes / direct owner API', async () => {
  let calls = 0;
  let identity = staff('ADMIN');
  const request = { headers: { authorization: `Bearer ${'a'.repeat(64)}` }, body: {} };
  const guard = new AdminTokenGuard({ authenticate: async token => { calls++; if (!token) throw new UnauthorizedException(); return identity; } }, new Reflector());
  let handler = AdminController.prototype.analytics;
  const context = { getHandler: () => handler, getClass: () => AdminController, switchToHttp: () => ({ getRequest: () => request, getResponse: () => ({ setHeader() {} }) }) };
  assert.equal(await guard.canActivate(context), true);
  identity = staff('ADMIN', { 'analytics.view': 'deny' });
  await assert.rejects(() => guard.canActivate(context), ForbiddenException);
  assert.equal(calls, 2);
  handler = () => {};
  await assert.rejects(() => guard.canActivate(context), ForbiddenException);
  handler = AdminStaffController.prototype.updateAccess;
  await assert.rejects(() => guard.canActivate(context), ForbiddenException);
  request.headers = { 'x-admin-token': 'legacy-token' };
  await assert.rejects(() => guard.canActivate(context), UnauthorizedException);
});

test('aggregate read endpoints redact denied content and nested settings', () => {
  const manager = staff();
  const region = { id: 1, slug: 'bishkek', name: 'Бишкек', enabled: true, contactPhone: 'private', deliveryFee: 50, deliveryOpenTime: '09:00', freeKitItems: ['kit'] };
  assert.deepEqual(filterAdminRegion(region, manager), { id: 1, slug: 'bishkek', name: 'Бишкек', enabled: true });
  const source = { region, categories: [{ title: 'Категория', products: [{ name: 'Ролл', category: { region }, modifierGroups: ['modifier'], kitItems: ['kit'] }] }], promotions: ['promotion'], kitCatalog: ['kit'] };
  const result = filterAdminDashboard(source, staff('ADMIN', { 'modifiers.view': 'deny', 'kits.view': 'deny', 'settings.view': 'deny', 'promotions.view': 'deny' }));
  assert.deepEqual(result.promotions, []);
  assert.deepEqual(result.categories[0].products[0].modifierGroups, []);
  assert.equal(result.categories[0].products[0].category, undefined);
  assert.equal(result.region.deliveryFee, undefined);
});

test('shared mutation endpoints cannot bypass modifier/kit/hours restrictions', () => {
  assert.throws(() => assertProductFields(staff('ADMIN', { 'modifiers.edit': 'deny' }), { modifierGroups: [] }), ForbiddenException);
  assert.throws(() => assertRegionFields(staff('ADMIN', { 'hours.edit': 'deny' }), { deliveryOpenTime: '10:00' }), ForbiddenException);
  assert.throws(() => assertRegionFields(staff('ADMIN', { 'kits.edit': 'deny' }), { freeKitItems: [] }), ForbiddenException);
});

test('shared mutation responses redact restricted fields and export receives fresh staff permissions', async () => {
  const identity = staff('ADMIN', { 'modifiers.view': 'deny', 'kits.view': 'deny', 'settings.view': 'deny' });
  const request = { staff: identity, body: { name: 'Updated' } };
  const controller = new AdminController({
    updateProduct: async () => ({ id: 1, name: 'Updated', modifierGroups: ['hidden'], kitItems: ['hidden'], category: { region: { deliveryFee: 99 } } }),
    updateRegion: async () => ({ id: 1, name: 'City', deliveryFee: 99, deliveryOpenTime: '10:00' }),
  }, {}, {});
  const product = await controller.updateProduct(request, 1, request.body);
  assert.equal(product.category, undefined);
  assert.deepEqual(product.modifierGroups, []);
  assert.deepEqual(product.kitItems, []);
  const region = await controller.updateRegion({ ...request, body: { deliveryOpenTime: '10:00' } }, 1, { deliveryOpenTime: '10:00' });
  assert.equal(region.deliveryFee, undefined);
  assert.equal(region.deliveryOpenTime, '10:00');
  let exported;
  const reports = new AdminReportsController({ export: (...args) => { exported = args; } });
  reports.export(request, 'bishkek', '2026-10-12', '2026-10-12');
  assert.equal(exported[3], identity);
});

test('last active owner cannot be deactivated or demoted and secret fields never serialize', () => {
  const owner = staff('OWNER');
  assert.throws(() => assertOwnerSurvives(owner, 'ADMIN', true, 1));
  assert.throws(() => assertOwnerSurvives(owner, 'OWNER', false, 1));
  assert.doesNotThrow(() => assertOwnerSurvives(owner, 'ADMIN', true, 2));
  assert.equal(publicStaff({ ...owner, passwordHash: 'private', tokenHash: 'private' }).passwordHash, undefined);
});

test('password hash is salted and verifies without storing the password', async () => {
  const first = await hashStaffPassword('correct-horse-battery');
  const second = await hashStaffPassword('correct-horse-battery');
  assert.notEqual(first, second);
  assert.equal(first.includes('correct-horse'), false);
  assert.equal(await verifyStaffPassword('correct-horse-battery', first), true);
  assert.equal(await verifyStaffPassword('incorrect-password', first), false);
  assert.equal(await verifyStaffPassword('password', 'broken'), false);
});
