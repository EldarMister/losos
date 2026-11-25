const assert = require('node:assert/strict');
const test = require('node:test');
const { randomUUID } = require('node:crypto');
require('reflect-metadata');
const { Module, Global, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { DataSource } = require('typeorm');
const { PGlite } = require('@electric-sql/pglite');
const { SiteSettingsModule } = require('../dist/site-settings/site-settings.module');
const { SiteSettingsService, DEFAULT_SITE_CONTACTS } = require('../dist/site-settings/site-settings.service');
const { hashStaffPassword } = require('../dist/admin/admin-security.service');
const { AddAdminSecurity1785010000000 } = require('../dist/migrations/1785010000000-AddAdminSecurity');
const { AddSiteContacts1785014000000 } = require('../dist/migrations/1785014000000-AddSiteContacts');

test('contact settings: HTTP access, validation, PostgreSQL persistence and city inheritance', async t => {
  const pg = new PGlite();
  const queryable = client => ({ query: async (sql, params) => (await client.query(sql, params)).rows });
  const db = { ...queryable(pg), manager: queryable(pg), transaction: work => pg.transaction(tx => work(queryable(tx))) };
  let app;
  try {
    await new AddAdminSecurity1785010000000().up(db);
    await new AddSiteContacts1785014000000().up(db);
    await db.query('CREATE TABLE regions (slug varchar(100) PRIMARY KEY, enabled boolean NOT NULL)');
    await db.query("INSERT INTO regions VALUES ('bishkek',true),('osh',true),('hidden',false)");
    const password = 'only-for-isolated-tests-2026';
    const hash = await hashStaffPassword(password);
    for (const [login, role] of [['owner','OWNER'],['manager','MANAGER']]) await db.query('INSERT INTO admin_staff (id,login,name,"passwordHash",role) VALUES ($1,$2,$2,$3,$4)', [randomUUID(), login, hash, role]);
    class TestDatabaseModule {}
    Global()(TestDatabaseModule); Module({ providers: [{ provide: DataSource, useValue: db }], exports: [DataSource] })(TestDatabaseModule);
    class TestModule {}
    Module({ imports: [TestDatabaseModule, SiteSettingsModule] })(TestModule);
    app = await NestFactory.create(TestModule, { logger: false });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const call = async (path, token, body) => {
      const response = await fetch(base + '/api' + path, { method: body ? 'PATCH' : 'GET', headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: response.status, data: await response.json() };
    };
    const tokens = {};
    for (const login of ['owner','manager']) {
      const response = await fetch(base + '/api/admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login, password }) });
      assert.equal(response.status, 200); tokens[login] = (await response.json()).token;
    }
    const next = { phone: '0505111222', email: 'contact@example.com', address: 'Test shared address', instagram: 'test_shared' };
    await t.test('public defaults and private administration', async () => {
      assert.deepEqual((await call('/site-settings')).data, DEFAULT_SITE_CONTACTS);
      assert.equal((await call('/admin/site-settings')).status, 401);
      assert.equal((await call('/admin/site-settings', tokens.manager)).status, 403);
      assert.equal((await call('/admin/site-settings', tokens.manager, { target: 'all', contacts: next })).status, 403);
      assert.equal((await call('/admin/site-settings', tokens.owner)).status, 200);
    });
    await t.test('reject invalid values and unknown cities without changing settings', async () => {
      for (const contacts of [{ ...next, instagram: 'javascript:alert(1)' }, { ...next, email: 'bad email' }, { ...next, phone: 'tel:bad' }, { ...next, address: 'a'.repeat(241) }, { ...next, email: undefined }]) assert.equal((await call('/admin/site-settings', tokens.owner, { target: 'all', contacts })).status, 400);
      assert.equal((await call('/admin/site-settings', tokens.owner, { target: 'all', useGlobal: true })).status, 400);
      assert.equal((await call('/admin/site-settings', tokens.owner, { target: 'missing', contacts: next })).status, 404);
      assert.deepEqual((await call('/site-settings')).data, DEFAULT_SITE_CONTACTS);
    });
    await t.test('global edits persist and city overrides do not change other cities', async () => {
      assert.equal((await call('/admin/site-settings', tokens.owner, { target: 'all', contacts: next })).status, 200);
      const osh = { ...next, address: 'Test Osh address', instagram: 'test_osh' };
      assert.equal((await call('/admin/site-settings', tokens.owner, { target: 'osh', contacts: { ...osh, instagram: '@test_osh' } })).status, 200);
      assert.deepEqual((await call('/site-settings?region=osh')).data, osh);
      assert.deepEqual((await call('/site-settings?region=bishkek')).data, next);
      assert.deepEqual(await new SiteSettingsService(db).settings(), (await call('/admin/site-settings', tokens.owner)).data);
    });
    await t.test('concurrent saves retain both scopes and a city can return to shared data', async () => {
      const global = { ...next, phone: '+996505333444' }, city = { ...next, address: 'Independent city' };
      const results = await Promise.all([call('/admin/site-settings', tokens.owner, { target: 'all', contacts: global }), call('/admin/site-settings', tokens.owner, { target: 'osh', contacts: city })]);
      assert.ok(results.every(result => result.status === 200));
      assert.deepEqual((await call('/site-settings?region=bishkek')).data, global);
      assert.deepEqual((await call('/site-settings?region=osh')).data, city);
      assert.equal((await call('/admin/site-settings', tokens.owner, { target: 'osh', useGlobal: true })).status, 200);
      assert.deepEqual((await call('/site-settings?region=osh')).data, global);
    });
    await t.test('hidden city contacts stay private and successful saves are audited', async () => {
      await call('/admin/site-settings', tokens.owner, { target: 'hidden', contacts: { ...next, address: 'Hidden address' } });
      assert.notEqual((await call('/site-settings?region=hidden')).data.address, 'Hidden address');
      const audit = await db.query("SELECT * FROM admin_audit WHERE action='update'");
      assert.ok(audit.length >= 5);
      assert.ok(audit.every(row => row.actorName === 'owner' && !JSON.stringify(row.details).includes(password)));
    });
    await new AddSiteContacts1785014000000().down(db);
    const [removed] = await db.query("SELECT to_regclass('site_contact_settings') AS name");
    assert.equal(removed.name, null);
  } finally { if (app) await app.close(); await pg.close(); }
});
