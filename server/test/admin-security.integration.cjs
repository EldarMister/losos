const assert = require('node:assert/strict');
const test = require('node:test');
const { randomUUID } = require('node:crypto');
require('reflect-metadata');
const { Module, Global, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { DataSource } = require('typeorm');
const { AdminSecurityModule } = require('../dist/admin/admin-security.module');
const { AdminSecurityService } = require('../dist/admin/admin-security.service');
const { AdminController } = require('../dist/admin/admin.controller');
const { AdminService } = require('../dist/admin/admin.service');
const { EduPosService } = require('../dist/edu-pos/edu-pos.service');
const { AdminNotificationsModule } = require('../dist/admin/notifications/admin-notifications.module');
const { AdminNotificationsService } = require('../dist/admin/notifications/admin-notifications.service');
const { AddAdminSecurity1785010000000 } = require('../dist/migrations/1785010000000-AddAdminSecurity');
const { AddAdminNotifications1785011000000 } = require('../dist/migrations/1785011000000-AddAdminNotifications');

const testDatabaseUrl = process.env.ADMIN_SECURITY_TEST_DATABASE_URL;
test('security HTTP + PostgreSQL transactions (isolated test schema)', { skip: !testDatabaseUrl }, async (t) => {
  const url = new URL(testDatabaseUrl);
  assert.ok(['localhost', '127.0.0.1'].includes(url.hostname), 'security integration test requires explicitly configured local DB');
  assert.match(url.pathname, /test/i, 'test database name required');
  const schema = `admin_security_test_${randomUUID().replaceAll('-', '')}`;
  const bootstrapToken = 'bootstrap-test-secret-'.repeat(3);
  const password = 'test-password-never-for-production';
  const previous = { token: process.env.ADMIN_TOKEN, bootstrap: process.env.ADMIN_BOOTSTRAP_ENABLED, vapid: process.env.ADMIN_VAPID_PUBLIC_KEY };
  process.env.ADMIN_TOKEN = bootstrapToken;
  process.env.ADMIN_BOOTSTRAP_ENABLED = 'true';
  delete process.env.ADMIN_VAPID_PUBLIC_KEY;
  const adminDb = await new DataSource({ type: 'postgres', url: testDatabaseUrl, synchronize: false }).initialize();
  let db;
  let app;
  try {
    await adminDb.query(`CREATE SCHEMA "${schema}"`);
    db = await new DataSource({ type: 'postgres', url: testDatabaseUrl, synchronize: false, extra: { options: `-c search_path=${schema},public` } }).initialize();
    const runner = db.createQueryRunner();
    await new AddAdminSecurity1785010000000().up(runner);
    await db.query('CREATE TABLE orders (id uuid PRIMARY KEY)');
    await new AddAdminNotifications1785011000000().up(runner);
    await runner.release();
    class TestDatabaseModule {}
    Global()(TestDatabaseModule);
    Module({ providers: [{ provide: DataSource, useValue: db }], exports: [DataSource] })(TestDatabaseModule);
    class TestApplicationModule {}
    Module({ imports: [TestDatabaseModule, AdminSecurityModule, AdminNotificationsModule], controllers: [AdminController], providers: [
      { provide: AdminService, useValue: { analytics: async () => ({ orders: 0 }), orders: async () => ({ items: [], total: 0 }), settings: async () => [{ id: 1, slug: 'bishkek', name: 'Бишкек', deliveryFee: 99, contactPhone: 'private' }] } },
      { provide: EduPosService, useValue: {} },
    ] })(TestApplicationModule);
    app = await NestFactory.create(TestApplicationModule, { logger: false });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const request = async (path, token, body, method = body ? 'POST' : 'GET', extraHeaders = {}) => {
      const response = await fetch(`${base}/api/admin${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const text = await response.text();
      return { status: response.status, headers: response.headers, body: text ? JSON.parse(text) : null };
    };
    const created = await request('/auth/bootstrap', null, { bootstrapToken, login: 'owner', name: 'Владелец', password });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const owner = created.body;
    const createStaff = async (login, role = 'MANAGER') => {
      const result = await request('/staff', owner.token, { login, name: login, password, role });
      assert.equal(result.status, 201, JSON.stringify(result.body));
      const session = await request('/auth/login', null, { login, password });
      assert.equal(session.status, 200, JSON.stringify(session.body));
      return { ...session.body, id: result.body.id };
    };
    const manager = await createStaff('manager');
    const admin = await createStaff('admin', 'ADMIN');

    await t.test('bootstrap one-shot; session secrets hashed; legacy admin header rejected', async () => {
      assert.equal((await request('/auth/bootstrap', null, { bootstrapToken, login: 'owner2', name: 'Other', password })).status, 409);
      assert.equal((await request('/orders', null, undefined, 'GET', { 'x-admin-token': bootstrapToken })).status, 401);
      assert.equal((await request('/orders', bootstrapToken)).status, 401);
      const rows = await db.query('SELECT "tokenHash" FROM admin_sessions');
      assert.ok(rows.every(row => /^[a-f0-9]{64}$/.test(row.tokenHash) && row.tokenHash !== owner.token));
      assert.equal((await request('/auth/me', manager.token)).headers.get('cache-control'), 'no-store');
    });

    await t.test('manager direct restricted URLs return 403; allowed orders work; settings is redacted', async () => {
      assert.equal((await request('/orders', manager.token)).status, 200);
      assert.equal((await request('/analytics', manager.token)).status, 403);
      assert.equal((await request('/staff', manager.token)).status, 403);
      assert.equal((await request('/dashboard', manager.token)).status, 403);
      const settings = await request('/settings', manager.token);
      assert.deepEqual(settings.body, [{ id: 1, slug: 'bishkek', name: 'Бишкек' }]);
    });

    await t.test('self-escalation, mass assignment and creating an alternate identity denied', async () => {
      assert.equal((await request(`/staff/${admin.id}/access`, admin.token, { role: 'OWNER' }, 'PATCH')).status, 403);
      assert.equal((await request(`/staff/${admin.id}`, admin.token, { role: 'OWNER', permissions: {} }, 'PATCH')).status, 403);
      assert.equal((await request('/staff', admin.token, { login: 'escape-user', name: 'Escape', password })).status, 403);
      assert.equal((await request(`/staff/${owner.staff.id}`, admin.token, { active: false }, 'PATCH')).status, 403);
      assert.equal((await request(`/staff/${manager.id}`, admin.token, { password: 'steal-other-account-password' }, 'PATCH')).status, 403);
      assert.equal((await request(`/staff/${manager.id}/access`, owner.token, { permissions: { 'unknown.permission': 'allow' } }, 'PATCH')).status, 400);
    });

    await t.test('fresh access takes effect without re-login and cannot be restored by restricted ADMIN', async () => {
      assert.equal((await request('/analytics', admin.token)).status, 200);
      assert.equal((await request(`/staff/${admin.id}/access`, owner.token, { permissions: { 'analytics.view': 'deny' } }, 'PATCH')).status, 200);
      assert.equal((await request('/analytics', admin.token)).status, 403);
      assert.equal((await request(`/staff/${admin.id}/access`, admin.token, { permissions: {} }, 'PATCH')).status, 403);
      const me = await request('/auth/me', admin.token);
      assert.equal(me.body.effectivePermissions.includes('analytics.view'), false);
      assert.equal(me.body.effectivePermissions.includes('analytics.export'), false);
      assert.equal((await request(`/staff/${admin.id}/access`, owner.token, { permissions: {} }, 'PATCH')).status, 200);
      assert.equal((await request('/analytics', admin.token)).status, 200);
    });

    await t.test('active realtime connection closes on permission revocation', async () => {
      const notifications = app.get(AdminNotificationsService);
      let subscription;
      const revoked = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { subscription?.unsubscribe(); reject(new Error('stream did not revoke within 6 seconds')); }, 6000);
        subscription = notifications.stream(manager.token).subscribe({ next: event => {
          if (event.type === 'sync') void request(`/staff/${manager.id}/access`, owner.token, { permissions: { 'orders.view': 'deny' } }, 'PATCH').catch(reject);
          if (event.type === 'access-revoked') { clearTimeout(timeout); resolve(event); }
        }, error: reject });
      });
      assert.equal((await revoked).data.status, 403);
      subscription.unsubscribe();
      assert.equal((await request('/events', manager.token)).status, 403);
      assert.equal((await request('/orders', manager.token)).status, 403);
      assert.equal((await request(`/staff/${manager.id}/access`, owner.token, { permissions: {} }, 'PATCH')).status, 200);
    });

    await t.test('logout removes only current session and cascades its push subscription', async () => {
      const logged = await request('/auth/login', null, { login: 'manager', password });
      const current = await app.get(AdminSecurityService).authenticate(logged.body.token);
      await db.query(`INSERT INTO admin_push_subscriptions ("staffId","sessionId","endpointHash",endpoint,p256dh,auth) VALUES ($1,$2,$3,$4,$5,$6)`, [manager.id, current.sessionId, 'a'.repeat(64), 'https://fcm.googleapis.com/test', 'public-key', 'auth-key']);
      assert.equal((await request('/auth/logout', logged.body.token, {})).status, 200);
      assert.equal((await request('/orders', logged.body.token)).status, 401);
      assert.equal((await request('/orders', manager.token)).status, 200);
      assert.equal(Number((await db.query('SELECT count(*) FROM admin_push_subscriptions'))[0].count), 0);
    });

    await t.test('disabling staff revokes sessions and audit excludes password/token values', async () => {
      assert.equal((await request(`/staff/${manager.id}`, owner.token, { active: false }, 'PATCH')).status, 200);
      assert.equal((await request('/auth/me', manager.token)).status, 401);
      assert.equal((await request('/auth/login', null, { login: 'manager', password })).status, 401);
      const audit = await request('/audit', owner.token);
      assert.equal(audit.status, 200);
      const serialized = JSON.stringify(audit.body);
      assert.equal(serialized.includes(password), false);
      assert.equal(serialized.includes(owner.token), false);
      assert.equal(serialized.includes(bootstrapToken), false);
      assert.ok(audit.body.items.some(item => item.action === 'staff.access'));
    });

    await t.test('parallel PostgreSQL transactions cannot demote the last two owners', async () => {
      const second = await createStaff('second-owner', 'OWNER');
      const results = await Promise.all([
        request(`/staff/${owner.staff.id}/access`, owner.token, { role: 'ADMIN' }, 'PATCH'),
        request(`/staff/${second.id}/access`, second.token, { role: 'ADMIN' }, 'PATCH'),
      ]);
      assert.equal(results.filter(result => result.status === 200).length, 1, JSON.stringify(results));
      assert.ok(results.some(result => [403, 409].includes(result.status)));
      const owners = await db.query(`SELECT id FROM admin_staff WHERE role='OWNER' AND active=true`);
      assert.equal(owners.length, 1);
      const remainingToken = owners[0].id === owner.staff.id ? owner.token : second.token;
      assert.equal((await request(`/staff/${owners[0].id}`, remainingToken, { active: false }, 'PATCH')).status, 409);
    });
  } finally {
    if (app) await app.close();
    if (db) await db.destroy();
    assert.match(schema, /^admin_security_test_[a-f0-9]+$/);
    await adminDb.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await adminDb.destroy();
    if (previous.token === undefined) delete process.env.ADMIN_TOKEN; else process.env.ADMIN_TOKEN = previous.token;
    if (previous.bootstrap === undefined) delete process.env.ADMIN_BOOTSTRAP_ENABLED; else process.env.ADMIN_BOOTSTRAP_ENABLED = previous.bootstrap;
    if (previous.vapid === undefined) delete process.env.ADMIN_VAPID_PUBLIC_KEY; else process.env.ADMIN_VAPID_PUBLIC_KEY = previous.vapid;
  }
});
