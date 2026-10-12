require('./local-admin-environment.cjs')();
require('reflect-metadata');
const assert = require('node:assert/strict');
const test = require('node:test');
const { randomUUID } = require('node:crypto');
const { DataSource } = require('typeorm');
const defaults = require('../dist/data-source').default;
const { Region } = require('../dist/catalog/region.entity');
const { Category } = require('../dist/catalog/category.entity');
const { Product } = require('../dist/catalog/product.entity');
const { Order } = require('../dist/orders/order.entity');
const { AdminService } = require('../dist/admin/admin.service');
const { CatalogService } = require('../dist/catalog/catalog.service');
const { AddCategoryImageVisibility1785013000000 } = require('../dist/migrations/1785013000000-AddCategoryImageVisibility');

test('admin editor changes preserve data (isolated PostgreSQL schema)', async t => {
  const schema = `admin_editor_test_${randomUUID().replaceAll('-', '')}`;
  const control = await new DataSource({type:'postgres',url:process.env.TEST_DATABASE_URL}).initialize();
  let db;
  try {
    await control.query(`CREATE SCHEMA "${schema}"`);
    db = await new DataSource({...defaults.options, schema, synchronize:true, migrationsRun:false, extra:{options:`-c search_path=${schema},public`}}).initialize();
    const regions = db.getRepository(Region), categories = db.getRepository(Category), products = db.getRepository(Product), orders = db.getRepository(Order);
    const admin = Object.assign(Object.create(AdminService.prototype), { regions, categories, products });
    const catalog = Object.assign(Object.create(CatalogService.prototype), { regionRepository:regions, categoryRepository:categories });
    const city = name => regions.save(regions.create({slug:`test-${randomUUID()}`, name, enabled:true}));
    const order = (region, repository=orders) => repository.save(repository.create({regionSlug:region.slug,customerName:'ТЕСТ',phone:'+996555000000',address:'ТЕСТ',subtotal:1,total:1,idempotencyKey:randomUUID(),requestFingerprint:'test'}));
    const anchor = await city('ТЕСТ основной');

    await t.test('deletes an empty city and refuses the last city', async () => {
      const extra = await city('ТЕСТ лишний');
      assert.equal((await admin.deleteRegion(extra.id)).deleted, true);
      assert.equal(await regions.findOneBy({id:extra.id}), null);
      await assert.rejects(admin.deleteRegion(anchor.id), /Последний город/);
    });
    await t.test('refuses a shared content source until consumers are detached', async () => {
      const source = await city('ТЕСТ источник'), consumer = await city('ТЕСТ потребитель');
      await admin.updateRegion(consumer.id,{menuSourceRegionSlug:source.slug});
      await assert.rejects(admin.deleteRegion(source.id), /Другие города/);
      await admin.updateRegion(consumer.id,{menuSourceRegionSlug:''});
      await admin.deleteRegion(consumer.id);
      await admin.deleteRegion(source.id);
    });
    await t.test('concurrent source assignment and deletion never leave a dangling source', async () => {
      const source = await city('ТЕСТ источник гонки'), consumer = await city('ТЕСТ зависимость гонки');
      const [assignment, deletion] = await Promise.allSettled([
        admin.updateRegion(consumer.id,{menuSourceRegionSlug:source.slug}),
        admin.deleteRegion(source.id),
      ]);
      assert.ok(assignment.status==='rejected' || deletion.status==='rejected');
      const saved = await regions.findOneBy({id:consumer.id});
      if(saved.menuSourceRegionSlug)assert.ok(await regions.findOneBy({slug:saved.menuSourceRegionSlug}));
      await admin.updateRegion(consumer.id,{menuSourceRegionSlug:''});
      await admin.deleteRegion(consumer.id);
      if(await regions.findOneBy({id:source.id}))await admin.deleteRegion(source.id);
    });
    await t.test('refuses nonempty cities without cascading away their catalog', async () => {
      const region = await city('ТЕСТ каталог');
      const category = await categories.save(categories.create({slug:'test',title:'ТЕСТ',region}));
      const product = await products.save(products.create({slug:'test',name:'ТЕСТ',price:1,image:'/test.png',category}));
      await assert.rejects(admin.deleteRegion(region.id), /Сначала удалите категории/);
      assert.ok(await products.findOneBy({id:product.id}));
      await products.delete(product.id); await categories.delete(category.id); await admin.deleteRegion(region.id);
    });
    await t.test('preserves historical orders and blocks deleting their city', async () => {
      const region = await city('ТЕСТ история');
      const saved = await order(region);
      await assert.rejects(admin.deleteRegion(region.id), /история заказов/);
      assert.ok(await orders.findOneBy({id:saved.id}));
      await orders.delete(saved.id); await admin.deleteRegion(region.id);
    });
    await t.test('an in-flight checkout holds its city until its order commits', async () => {
      const region = await city('ТЕСТ конкурентный заказ');
      let release, started;
      const hold = new Promise(resolve => {release=resolve;});
      const locked = new Promise(resolve => {started=resolve;});
      const checkout = db.transaction(async manager => {
        await manager.getRepository(Region).findOne({where:{id:region.id},lock:{mode:'pessimistic_read'}});
        started(); await hold;
        return order(region,manager.getRepository(Order));
      });
      await locked;
      const deletion = admin.deleteRegion(region.id);
      release();
      const saved = await checkout;
      await assert.rejects(deletion,/история заказов/);
      await orders.delete(saved.id); await admin.deleteRegion(region.id);
    });
    await t.test('clearing and replacing category images survives database reloads', async () => {
      const runner = db.createQueryRunner();
      await runner.query('ALTER TABLE categories DROP COLUMN "imageHidden"');
      await new AddCategoryImageVisibility1785013000000().up(runner);
      await runner.release();
      const category = await categories.save(categories.create({slug:'photo',title:'ТЕСТ фото',region:anchor,image:''}));
      const product = await products.save(products.create({slug:'photo',name:'ТЕСТ фото',price:1,image:'/fallback.png',category}));
      assert.equal(category.imageHidden,false);
      await admin.updateCategory(category.id,{image:'',imageHidden:true});
      let result = (await catalog.categories(anchor.slug))[0];
      assert.equal(result.imageHidden,true); assert.equal(result.image,''); assert.equal(result.products[0].image,'/fallback.png');
      await admin.updateCategory(category.id,{image:'/replacement.png',imageHidden:false});
      result = (await catalog.categories(anchor.slug))[0];
      assert.equal(result.imageHidden,false); assert.equal(result.image,'/replacement.png');
      await products.delete(product.id); await categories.delete(category.id);
    });
    await t.test('two concurrent deletions still leave one city', async () => {
      const extra = await city('ТЕСТ второй');
      const results = await Promise.allSettled([admin.deleteRegion(anchor.id),admin.deleteRegion(extra.id)]);
      assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
      assert.equal(await regions.count(),1);
    });
  } finally {
    if(db?.isInitialized)await db.destroy();
    await control.query(`DROP SCHEMA "${schema}" CASCADE`);
    await control.destroy();
  }
});
