require("./local-admin-environment.cjs")();
const { randomBytes, createHmac } = require("node:crypto");
const { NestFactory } = require("@nestjs/core");
const { DataSource } = require("typeorm");
const { AppModule } = require("../dist/app.module");
const { AdminSecurityService } = require("../dist/admin/admin-security.service");
const { OrdersService } = require("../dist/orders/orders.service");
const { Product } = require("../dist/catalog/product.entity");
const { PhoneAccountSession } = require("../dist/auth/phone-account-session.entity");
const { PhoneAccount } = require("../dist/auth/phone-account.entity");
const { Order } = require("../dist/orders/order.entity");

async function main() {
  process.env.SEED_CATALOG_ON_STARTUP = "true";
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });
  try {
    const db = app.get(DataSource);
    const security = app.get(AdminSecurityService);
    const existing = await db.query(`SELECT id FROM admin_staff WHERE login='owner-test'`);
    const account = existing.length ? await security.login({ login: "owner-test", password: "TestOwner-Local2026!" }, "127.0.0.1")
      : await security.bootstrap({ login: "owner-test", name: "Тестовый владелец", password: "TestOwner-Local2026!", bootstrapToken: process.env.ADMIN_TOKEN }, "127.0.0.1");
    const owner = await security.authenticate(account.token);
    if (!(await db.query(`SELECT id FROM admin_staff WHERE login='manager-test'`)).length) {
      await security.createStaff(owner, { login: "manager-test", name: "Тестовый менеджер", password: "TestManager-Local2026!", role: "MANAGER", permissions: {} });
    }
    await db.query(`UPDATE regions SET "deliveryIs24Hours"=true WHERE slug='bishkek'`);
    const products = await db.getRepository(Product).find({ where: { available: true, category: { region: { slug: "bishkek" } } }, relations: { category: true }, order: { id: "ASC" } });
    const eligible = products.filter(product => !product.modifierGroups.some(group => group.required || group.minSelections > 0));
    if (!eligible.length) throw new Error("No orderable fixture products");
    for (let index = 0; index < 3; index++) {
      const key = `admin-browser-TEST-order-${index + 1}`;
      let result = await db.getRepository(Order).findOneBy({ idempotencyKey: key });
      if (!result) {
        const token = randomBytes(32).toString("hex");
        const phone = `+99655500010${index}`;
        await db.getRepository(PhoneAccount).upsert({ phone }, ["phone"]);
        await db.getRepository(PhoneAccountSession).save({ phone, tokenHash: createHmac("sha256", process.env.OTP_HASH_SECRET).update(token).digest("hex"), expiresAt: new Date(Date.now() + 86400000) });
        result = await app.get(OrdersService).create({ idempotencyKey: key, regionSlug: "bishkek", customerName: `ТЕСТ · Клиент ${index + 1}`, phone, verificationToken: token, address: "ТЕСТОВЫЕ ДАННЫЕ · Бишкек", comment: "Только для проверки новой панели в локальной тестовой БД", deliveryType: index === 2 ? "pickup" : "delivery", paymentMethod: "cash", items: [{ productId: eligible[index % eligible.length].id, quantity: index + 1, modifiers: [] }] });
      }
      // Explicit fixture state, not a simulated successful kitchen submission.
      // Runtime confirmations still require the real EDU POS integration.
      if (index > 0 && result.status === "new") await db.getRepository(Order).update(result.id, {
        status: index === 1 ? "preparing" : "completed", adminConfirmedAt: new Date(),
        completedAt: index === 2 ? new Date() : null,
      });
    }
    console.log("Local TEST fixtures ready: owner-test / TestOwner-Local2026!, manager-test / TestManager-Local2026!, 3 real persisted test orders. No outbound integrations.");
  } finally { await app.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
