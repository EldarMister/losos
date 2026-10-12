const assert = require('node:assert/strict');
const test = require('node:test');
const { randomUUID } = require('node:crypto');
require('reflect-metadata');
const { DataSource } = require('typeorm');
const { plainToInstance } = require('class-transformer');
const { validate } = require('class-validator');
const { Region } = require('../dist/catalog/region.entity');
const { Category } = require('../dist/catalog/category.entity');
const { Product } = require('../dist/catalog/product.entity');
const { Promotion } = require('../dist/catalog/promotion.entity');
const { PickupLocation } = require('../dist/catalog/pickup-location.entity');
const { Order } = require('../dist/orders/order.entity');
const { OrderItem } = require('../dist/orders/order-item.entity');
const { OrdersService } = require('../dist/orders/orders.service');
const { AdminService } = require('../dist/admin/admin.service');
const { EduPosService } = require('../dist/edu-pos/edu-pos.service');
const { CreateCategoryDto, CreateProductDto } = require('../dist/admin/admin.dto');
const { AdminReportsService, reportDates, csvReportCell } = require('../dist/admin/admin-reports.service');
const { AddAdminSecurity1785010000000 } = require('../dist/migrations/1785010000000-AddAdminSecurity');
const { AddAdminNotifications1785011000000 } = require('../dist/migrations/1785011000000-AddAdminNotifications');

test('report calendar validation and spreadsheet formula escaping', () => {
  const dates = reportDates('2026-10-12', '2026-10-12');
  assert.equal(dates.start.toISOString(), '2026-10-11T18:00:00.000Z');
  assert.equal(dates.end.toISOString(), '2026-10-12T18:00:00.000Z');
  assert.equal(dates.previousStart.toISOString(), '2026-10-10T18:00:00.000Z');
  for (const input of ['2026-02-30', '2025-02-29', '2026-13-01', 'bad']) assert.throws(() => reportDates(input, input));
  assert.throws(() => reportDates('2026-10-13', '2026-10-12'));
  assert.throws(() => reportDates('2024-01-01', '2026-01-01'));
  assert.equal(csvReportCell('=1+1'), '"\'=1+1"');
  assert.equal(csvReportCell('  @SUM(A1)'), '"\'  @SUM(A1)"');
  assert.equal(csvReportCell('Ролл "Филадельфия"'), '"Ролл ""Филадельфия"""');
});

const testUrl = process.env.ADMIN_REPORTS_TEST_DATABASE_URL;
test('admin catalog, reports, customers and concurrent order writes on PostgreSQL', { skip: !testUrl }, async t => {
  const url = new URL(testUrl);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
  assert.match(url.pathname, /test/i);
  const schema = `admin_reports_test_${randomUUID().replaceAll('-', '')}`;
  const control = await new DataSource({ type: 'postgres', url: testUrl }).initialize();
  let db;
  try {
    await control.query(`CREATE SCHEMA "${schema}"`);
    db = await new DataSource({ type: 'postgres', url: testUrl, schema, entities: [Region, Category, Product, Promotion, PickupLocation, Order, OrderItem], synchronize: true, extra: { options: `-c search_path=${schema},public` } }).initialize();
    const runner = db.createQueryRunner();
    await new AddAdminSecurity1785010000000().up(runner);
    await new AddAdminNotifications1785011000000().up(runner);
    await runner.release();
    const repo = entity => db.getRepository(entity);
    const admin = new AdminService(repo(Region), repo(PickupLocation), repo(Category), repo(Product), repo(Promotion), repo(Order), { sendOrderStatus: async () => {} }, {});
    const reports = new AdminReportsService(db);
    const region = await repo(Region).save({ slug: 'reports-test', name: 'Отчёты', deliveryIs24Hours: true });
    await repo(Region).save({ slug: 'other-test', name: 'Другой город', deliveryIs24Hours: true });
    const owner = { id: randomUUID(), name: 'Проверяющий', role: 'OWNER', active: true, permissions: {} };
    await db.query(`INSERT INTO admin_staff (id,login,name,"passwordHash",role) VALUES ($1,'reports-owner',$2,'unused','OWNER')`, [owner.id, owner.name]);
    const makeOrder = async (values = {}) => {
      const order = await repo(Order).save(repo(Order).create({ regionSlug: region.slug, customerName: 'Имя из заказа', phone: '+996555100100', address: 'Тестовый адрес', idempotencyKey: randomUUID(), requestFingerprint: 'a'.repeat(64), subtotal: 100, total: 100, status: 'new', ...values }));
      // Match PostgreSQL's timestamp-without-zone DEFAULT now() convention,
      // independently of the Node process and database server time zones.
      if (values.createdAt) await db.query(`UPDATE orders SET "createdAt"=$2::timestamptz AT TIME ZONE current_setting('TIMEZONE') WHERE id=$1`, [order.id, values.createdAt]);
      if (values.updatedAt) await db.query(`UPDATE orders SET "updatedAt"=$2::timestamptz AT TIME ZONE current_setting('TIMEZONE') WHERE id=$1`, [order.id, values.updatedAt]);
      return repo(Order).findOneOrFail({ where: { id: order.id }, relations: { items: true } });
    };
    let category;
    let product;
    await t.test('visible names create catalog entries without technical slugs', async () => {
      const categoryDto = plainToInstance(CreateCategoryDto, { regionSlug: region.slug, title: 'Исторические роллы', image: '/test.png' });
      assert.equal((await validate(categoryDto)).length, 0);
      category = await admin.createCategory(categoryDto);
      assert.match(category.slug, /^category-/);
      const productDto = plainToInstance(CreateProductDto, { regionSlug: region.slug, categoryId: category.id, name: '=Формула', price: 100, image: '/test.png' });
      assert.equal((await validate(productDto)).length, 0);
      product = await admin.createProduct(productDto);
      assert.match(product.slug, /^product-/);
      await assert.rejects(admin.deleteCategory(category.id), error => error.getStatus() === 409);
      const page = await reports.catalogPage(region.slug, 'Формула', category.id, 1, 0, owner);
      assert.equal(page.total, 1);
      assert.equal(page.items[0].id, product.id);
    });
    await t.test('category uniqueness is enforced atomically and ordinary edits retain generated slugs', async () => {
      const dto = { regionSlug: region.slug, title: 'Дубликат', image: '/test.png', slug: 'same-slug' };
      const results = await Promise.allSettled([admin.createCategory(dto), admin.createCategory(dto)]);
      assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
      assert.ok([400, 409].includes(results.find(result => result.status === 'rejected').reason.getStatus()));
      await assert.rejects(admin.updateCategory(category.id, { slug: dto.slug }), error => error.getStatus() === 409);
      const updated = await admin.updateCategory(category.id, { title: 'Исторические роллы' });
      assert.equal(updated.slug, category.slug);
      const updatedProduct = await admin.updateProduct(product.id, { price: 100 });
      assert.equal(updatedProduct.slug, product.slug);
    });
    await t.test('checkout saves the category snapshot independently of subsequent catalog edits', async () => {
      const checkout = new OrdersService(repo(Order), { consumeVerification: async () => {} }, { assertProductsOrderable: () => {} });
      const created = await checkout.create({ regionSlug: region.slug, idempotencyKey: randomUUID(), customerName: 'Покупатель', phone: '+996555100900', address: 'Тест', items: [{ productId: product.id, quantity: 1 }] });
      await admin.updateCategory(category.id, { title: 'Новое название' });
      const snapshot = await repo(OrderItem).findOneByOrFail({ order: { id: created.id } });
      assert.equal(snapshot.categoryName, 'Исторические роллы');
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bishkek' }).format(new Date());
      const live = await reports.report(region.slug, today, today);
      assert.equal(live.current.orders, 1, 'database-generated local timestamps must fall into the current Bishkek day');
      await repo(Order).delete(created.id);
    });
    await t.test('daily analytics use Bishkek boundaries, completion time, snapshots and modifier pricing scopes', async () => {
      const seed = async ({ created, completed, phone, total, status = 'completed', ...extra }) => {
        const order = await makeOrder({ phone, total, subtotal: total, status, createdAt: new Date(created), updatedAt: new Date(completed || created), completedAt: completed ? new Date(completed) : null, ...extra });
        if (status === 'completed') await repo(OrderItem).save({ order, productId: product.id, productName: '=Формула', categoryName: 'Исторические роллы', basePrice: 100, baseTotal: total, unitPrice: 100, quantity: total === 300 ? 3 : 1, lineTotal: total, configurationKey: 'b'.repeat(64), modifierSnapshots: total === 300 ? [
          { groupId: 'g1', groupTitle: 'Соус', itemId: 'i1', itemName: 'Порционный', price: 10, quantity: 2, totalPrice: 20, priceScope: 'per-product' },
          { groupId: 'g2', groupTitle: 'Добавка', itemId: 'i2', itemName: 'На строку', price: 50, quantity: 1, totalPrice: 50, priceScope: 'per-line' },
        ] : [] });
        return order;
      };
      await seed({ created: '2026-10-11T17:59:59.999Z', completed: '2026-10-11T17:59:59.999Z', phone: '+996555100101', total: 100 });
      await seed({ created: '2026-10-11T18:00:00.000Z', completed: '2026-10-11T18:00:00.000Z', phone: '+996555100102', total: 200, kitItems: [{ id: 'soy', name: 'Соус', quantity: 2 }] });
      await seed({ created: '2026-10-12T17:59:59.999Z', completed: '2026-10-12T17:59:59.999Z', phone: '+996555100101', total: 300 });
      await seed({ created: '2026-10-12T18:00:00.000Z', completed: '2026-10-12T18:00:00.000Z', phone: '+996555100103', total: 900 });
      await seed({ created: '2026-10-12T00:00:00.000Z', phone: '+996555100102', total: 400, status: 'cancelled' });
      await seed({ created: '2026-10-11T16:00:00.000Z', completed: '2026-10-12T02:00:00.000Z', phone: '+996555100104', total: 500 });
      await seed({ created: '2026-10-12T01:00:00.000Z', completed: '2026-10-12T01:00:00.000Z', phone: '+996555100105', total: 9999, regionSlug: 'other-test' });
      const report = await reports.report(region.slug, '2026-10-12', '2026-10-12', owner);
      assert.equal(report.current.orders, 3);
      assert.equal(report.current.completed, 3);
      assert.equal(report.current.revenue, 1000);
      assert.equal(report.current.average, 1000 / 3);
      assert.equal(report.current.cancelled, 1);
      assert.equal(report.current.newCustomers, 1);
      assert.equal(report.current.repeatCustomers, 1);
      assert.equal(report.previous.revenue, 100);
      assert.equal(report.previous.orders, 2);
      assert.deepEqual(report.days, [{ label: '2026-10-12', count: 3, revenue: 1000 }]);
      assert.equal(report.hours.length, 24);
      assert.equal(report.hours.find(hour => hour.hour === 0).revenue, 200);
      assert.equal(report.hours.find(hour => hour.hour === 23).revenue, 300);
      assert.deepEqual(report.categories, [{ name: 'Исторические роллы', count: 5, revenue: 1000 }]);
      assert.deepEqual(report.modifiers, [{ name: 'Порционный', count: 6, revenue: 60 }, { name: 'На строку', count: 1, revenue: 50 }]);
      assert.deepEqual(report.kits, [{ name: 'Соус', count: 2 }]);
      assert.equal(report.returns, null);
      assert.equal(report.profit, null);
      const csv = await reports.export(region.slug, '2026-10-12', '2026-10-12');
      assert.equal(csv.filename, 'nakta-report-2026-10-12-2026-10-12.csv');
      assert.ok(csv.csv.startsWith('\uFEFF'));
      assert.ok(csv.csv.includes('"\'=Формула"'));
      assert.ok(csv.csv.includes('"Выручка, сом";"1000"'));
      const order = await repo(Order).findOneByOrFail({ phone: '+996555100102', status: 'completed' });
      await db.query(`INSERT INTO admin_audit ("actorId","actorName",action,target,details,"createdAt") VALUES ($1,$2,'order.status',$3,'{"status":"completed"}','2026-10-12T06:00:00Z')`, [owner.id, owner.name, order.id]);
      const allowed = await reports.export(region.slug, '2026-10-12', '2026-10-12', owner);
      assert.ok(allowed.csv.includes('"Персонал"'));
      assert.ok(allowed.csv.includes(`"${owner.name}";"1";"1"`));
      const denied = await reports.export(region.slug, '2026-10-12', '2026-10-12', { ...owner, role: 'ADMIN', permissions: { 'audit.view': 'deny' } });
      assert.equal(denied.csv.includes('"Персонал"'), false);
      assert.equal(denied.csv.includes(owner.name), false);
    });
    await t.test('customer history pages preserve full totals and edited names are searchable without modifying orders', async () => {
      const phone = '+996555100101';
      await db.query('INSERT INTO admin_customer_profiles (phone,name) VALUES ($1,$2)', [phone, 'Имя из профиля']);
      const customer = await admin.customer(phone, region.slug, 1, 0);
      const second = await admin.customer(phone, region.slug, 1, 1);
      assert.equal(customer.customerName, 'Имя из профиля');
      assert.equal(customer.total, 2);
      assert.equal(customer.revenue, 400);
      assert.equal(customer.orders.length, 1);
      assert.equal(second.orders.length, 1);
      assert.notEqual(customer.orders[0].id, second.orders[0].id);
      const result = await admin.customers(region.slug, 'Имя из профиля', 25, 0);
      assert.equal(result.total, 1);
      assert.equal(result.items[0].customerName, 'Имя из профиля');
      assert.equal(result.items[0].ordersCount, 2);
      const historical = await admin.customers(region.slug, 'Имя из заказа', 25, 0);
      assert.ok(historical.items.some(item => item.phone === phone));
      assert.equal((await repo(Order).findOneByOrFail({ phone })).customerName, 'Имя из заказа');
      await assert.rejects(admin.customer(phone, 'other-test'), error => error.getStatus() === 404);
    });
    await t.test('kit CAS handles PostgreSQL microseconds and rejects a simultaneous stale write', async () => {
      const order = await makeOrder({ kitItems: [{ id: 'soy-sauce', name: 'Соус', quantity: 2 }], includedKitItems: [{ id: 'soy-sauce', name: 'Соус', quantity: 2 }] });
      await db.query(`UPDATE orders SET "updatedAt"='2026-10-01 00:00:00.123456' WHERE id=$1`, [order.id]);
      const initial = await repo(Order).findOneByOrFail({ id: order.id });
      const edit = quantity => admin.updateOrderKit(order.id, { noUtensils: false, utensilsCount: quantity, kitItems: [{ id: 'soy-sauce', quantity }], expectedUpdatedAt: initial.updatedAt.toISOString() });
      const results = await Promise.allSettled([edit(1), edit(2)]);
      assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
      assert.equal(results.find(result => result.status === 'rejected').reason.getStatus(), 409);
      const saved = await repo(Order).findOneByOrFail({ id: order.id });
      assert.ok(saved.updatedAt > initial.updatedAt);
      await repo(Order).update(order.id, { posSyncStatus: 'submitting' });
      await assert.rejects(admin.updateOrderKit(order.id, { noUtensils: true, utensilsCount: 0, kitItems: [] }), error => error.getStatus() === 409);
    });
    await t.test('parallel terminal transitions commit one status and one audit entry', async () => {
      const order = await makeOrder({ status: 'ready' });
      const results = await Promise.allSettled(['completed', 'cancelled'].map(status => admin.updateOrderStatus(order.id, status, 'ready', order.updatedAt.toISOString(), owner)));
      assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
      assert.equal(results.find(result => result.status === 'rejected').reason.getStatus(), 409);
      const rows = await db.query(`SELECT details FROM admin_audit WHERE target=$1 AND action='order.status'`, [order.id]);
      assert.equal(rows.length, 1);
      const saved = await repo(Order).findOneByOrFail({ id: order.id });
      assert.equal(rows[0].details.status, saved.status);
      assert.ok(saved.updatedAt > order.updatedAt);
      if (saved.status === 'completed') assert.ok(saved.completedAt);
    });
    await t.test('kitchen submission refuses a version changed by another administrator before contacting POS', async () => {
      const order = await makeOrder();
      let requests = 0;
      const pos = new EduPosService({ isConfigured: () => true, createOrder: async () => { requests++; throw new Error('must not send'); } }, repo(Product), repo(Category), repo(Region), repo(Order), repo(OrderItem));
      await admin.updateOrderKit(order.id, { noUtensils: true, utensilsCount: 0, kitItems: [], expectedUpdatedAt: order.updatedAt.toISOString() });
      await assert.rejects(pos.confirmOrder(order), error => error.getStatus() === 409);
      assert.equal(requests, 0);
    });
  } finally {
    if (db?.isInitialized) await db.destroy();
    assert.match(schema, /^admin_reports_test_[a-f0-9]+$/);
    await control.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await control.destroy();
  }
});
