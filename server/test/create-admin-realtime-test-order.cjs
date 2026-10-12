// Manual browser verification helper: creates one clearly labelled order only
// in the explicit local test database. No payment, kitchen or phone provider.
require("./local-admin-environment.cjs")();
const { randomBytes, randomUUID, createHmac } = require("node:crypto");
const { NestFactory } = require("@nestjs/core");
const { DataSource } = require("typeorm");
const { AppModule } = require("../dist/app.module");
const { OrdersService } = require("../dist/orders/orders.service");
const { Product } = require("../dist/catalog/product.entity");
const { PhoneAccount } = require("../dist/auth/phone-account.entity");
const { PhoneAccountSession } = require("../dist/auth/phone-account-session.entity");

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });
  try {
    const db = app.get(DataSource);
    const products = await db.getRepository(Product).find({ where: { available: true, category: { region: { slug: "bishkek" } } }, relations: { category: true }, order: { id: "ASC" } });
    const product = products.find(item => !item.modifierGroups.some(group => group.required || group.minSelections > 0));
    if (!product) throw new Error("Prepare local browser fixtures first");
    const phone = "+996555000199";
    const token = randomBytes(32).toString("hex");
    await db.getRepository(PhoneAccount).upsert({ phone }, ["phone"]);
    await db.getRepository(PhoneAccountSession).save({ phone, tokenHash: createHmac("sha256", process.env.OTP_HASH_SECRET).update(token).digest("hex"), expiresAt: new Date(Date.now() + 86400000) });
    const order = await app.get(OrdersService).create({
      idempotencyKey: `admin-realtime-TEST-${randomUUID()}`, regionSlug: "bishkek",
      customerName: "ТЕСТ · Уведомление нового заказа", phone, verificationToken: token,
      address: "ТЕСТОВЫЕ ДАННЫЕ · Бишкек", comment: "Локальная проверка SSE, звука и счётчиков. Не отправлять на кухню.",
      deliveryType: "delivery", paymentMethod: "cash", items: [{ productId: product.id, quantity: 1, modifiers: [] }],
    });
    console.log(JSON.stringify({ testOrderCreated: true, id: order.id, orderNumber: order.orderNumber, status: order.status }));
  } finally { await app.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
