/* Real PostgreSQL transactions/auth/events; only external phone and Web Push
 * transports are stubbed. Refuses remote or non-test databases. */
const assert = require("node:assert/strict");
const { randomBytes, randomUUID } = require("node:crypto");

async function main() {
  const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is required");
  const parsed = new URL(url);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) || !/test/i.test(parsed.pathname)) {
    throw new Error("Notification integration tests require a local database with test in its name");
  }
  process.env.DATABASE_URL = url;
  const db = require("../dist/data-source").default;
  const { OrdersService } = require("../dist/orders/orders.service");
  const { Order } = require("../dist/orders/order.entity");
  const { Region } = require("../dist/catalog/region.entity");
  const { Category } = require("../dist/catalog/category.entity");
  const { Product } = require("../dist/catalog/product.entity");
  const { AdminSecurityService, hashSessionToken } = require("../dist/admin/admin-security.service");
  const { AdminNotificationsService } = require("../dist/admin/notifications/admin-notifications.service");
  const webpush = require("web-push");
  const originalSend = webpush.sendNotification;
  const originalVapid = [process.env.ADMIN_VAPID_PUBLIC_KEY, process.env.ADMIN_VAPID_PRIVATE_KEY, process.env.ADMIN_VAPID_SUBJECT];
  const slug = `notification-test-${randomUUID().slice(0, 8)}`;
  const staffIds = [randomUUID(), randomUUID()];
  const sessions = [randomUUID(), randomUUID()];
  const tokens = [randomBytes(32).toString("hex"), randomBytes(32).toString("hex")];
  let stream;
  let preservedPendingEvents = [];
  await db.initialize();
  try {
    const region = await db.getRepository(Region).save({ slug, name: "Notification test", enabled: true, deliveryIs24Hours: true });
    const category = await db.getRepository(Category).save({ slug, title: "Test category snapshot", region });
    const product = await db.getRepository(Product).save({ slug, name: "Test notification product", price: 100, image: "/test.png", category, available: true, modifierGroups: [], kitItems: [] });
    for (let index = 0; index < staffIds.length; index++) {
      await db.query(`INSERT INTO admin_staff (id,login,name,"passwordHash",role) VALUES ($1,$2,$3,'test-not-a-password','MANAGER')`, [staffIds[index], `${slug}-${index}`, "Notification integration employee"]);
      await db.query(`INSERT INTO admin_sessions (id,"staffId","tokenHash","expiresAt") VALUES ($1,$2,$3,now()+interval '1 hour')`, [sessions[index], staffIds[index], hashSessionToken(tokens[index])]);
    }
    const security = new AdminSecurityService(db);
    const notifications = new AdminNotificationsService(db, security);
    const orders = new OrdersService(db.getRepository(Order), { consumeVerification: async () => {} }, { assertProductsOrderable: () => {} });
    const orderDto = { idempotencyKey: `${slug}-first`, regionSlug: slug, customerName: "Integration fixture", phone: "+996555000101", address: "Local test", paymentMethod: "cash", deliveryType: "delivery", items: [{ productId: product.id, quantity: 1, modifiers: [] }] };

    const transaction = db.manager.transaction;
    db.manager.transaction = async function (callback) {
      return transaction.call(this, async manager => {
        const result = await callback(manager);
        const rows = await db.query(`SELECT id FROM admin_order_events WHERE "orderId"=$1`, [result.id]);
        assert.equal(rows.length, 0, "uncommitted event must be invisible to a separate connection");
        return result;
      });
    };
    let created;
    try { created = await orders.create(orderDto); } finally { db.manager.transaction = transaction; }
    let rows = await db.query(`SELECT * FROM admin_order_events WHERE "orderId"=$1`, [created.id]);
    assert.equal(rows.length, 1, "committed checkout publishes one persisted event");
    const eventId = rows[0].id;
    const repeated = await orders.create(orderDto);
    assert.equal(repeated.id, created.id);
    rows = await db.query(`SELECT * FROM admin_order_events WHERE "orderId"=$1`, [created.id]);
    assert.equal(rows.length, 1, "checkout retry creates no duplicate event");
    assert.equal(rows[0].id, eventId, "event identity remains stable");

    db.manager.transaction = async function (callback) {
      return transaction.call(this, async manager => { await callback(manager); throw new Error("intentional rollback"); });
    };
    try { await assert.rejects(orders.create({ ...orderDto, idempotencyKey: `${slug}-rollback` }), /intentional rollback/); }
    finally { db.manager.transaction = transaction; }
    assert.equal((await db.query(`SELECT id FROM orders WHERE "idempotencyKey"=$1`, [`${slug}-rollback`])).length, 0);
    assert.equal((await db.query(`SELECT id FROM admin_order_events WHERE "regionSlug"=$1`, [slug])).length, 1, "rolled-back orders emit nothing");
    console.log("PASS committed-only outbox, stable event, idempotency and rollback");

    // Hold the first checkout immediately before commit while another checkout
    // reaches its outbox insert. A sequence cursor must never pass the first one.
    let releaseFirst;
    let firstReady;
    const heldCommit = new Promise(resolve => { releaseFirst = resolve; });
    const firstReachedCommit = new Promise(resolve => { firstReady = resolve; });
    db.manager.transaction = async function (callback) {
      return transaction.call(this, async manager => {
        const result = await callback(manager);
        if (result.idempotencyKey === `${slug}-concurrent-first`) { firstReady(); await heldCommit; }
        return result;
      });
    };
    let firstCheckout;
    let secondCheckout;
    try {
      firstCheckout = orders.create({ ...orderDto, idempotencyKey: `${slug}-concurrent-first` });
      await firstReachedCommit;
      let secondFinished = false;
      secondCheckout = orders.create({ ...orderDto, idempotencyKey: `${slug}-concurrent-second` }).then(value => { secondFinished = true; return value; });
      const deadline = Date.now() + 5000;
      let waiting = false;
      while (!secondFinished && !waiting && Date.now() < deadline) {
        waiting = (await db.query(`SELECT 1 FROM pg_locks WHERE locktype='advisory' AND classid=1785011 AND objid=0 AND NOT granted`)).length > 0;
        if (!waiting) await new Promise(resolve => setTimeout(resolve, 20));
      }
      assert.equal(secondFinished, false, "a later checkout must not commit a higher event cursor before an earlier pending event");
      assert.equal(waiting, true, "concurrent checkout waits for the earlier outbox transaction to commit");
      releaseFirst();
      const results = await Promise.all([firstCheckout, secondCheckout]);
      const committed = await db.query(`SELECT "orderId" FROM admin_order_events WHERE "orderId"=ANY($1::uuid[]) ORDER BY sequence`, [results.map(order => order.id)]);
      assert.deepEqual(committed.map(event => event.orderId), results.map(order => order.id));
    } finally {
      releaseFirst();
      db.manager.transaction = transaction;
      await Promise.allSettled([firstCheckout, secondCheckout].filter(Boolean));
    }
    console.log("PASS concurrent checkout events follow commit order without skipped SSE cursors");

    const messages = [];
    let streamError;
    stream = notifications.stream(tokens[0]).subscribe({ next: value => messages.push(value), error: error => { streamError = error; } });
    async function waitFor(predicate, timeout = 6000) {
      const deadline = Date.now() + timeout;
      while (!predicate()) {
        if (streamError) throw streamError;
        if (Date.now() > deadline) throw new Error("Timed out waiting for SSE state");
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
    await waitFor(() => messages.some(message => message.type === "sync"));
    assert.equal(messages.filter(message => message.type === "order.created").length, 0, "first connection does not replay old orders");
    await waitFor(() => messages.some(message => message.type === "heartbeat"));
    assert.equal(messages.find(message => message.type === "heartbeat").id, messages.find(message => message.type === "sync").id, "heartbeats carry the real outbox cursor so Nest cannot synthesize unrelated IDs");
    const second = await orders.create({ ...orderDto, idempotencyKey: `${slug}-second` });
    await waitFor(() => messages.some(message => message.type === "order.created" && message.data.orderId === second.id));

    const recoveredMessages = [];
    const recoveredStream = notifications.stream(tokens[0], "999999999999999999").subscribe({ next: value => recoveredMessages.push(value), error: error => { streamError = error; } });
    try {
      await waitFor(() => recoveredMessages.some(message => message.type === "sync"));
      const [{ cursor: currentCursor }] = await db.query(`SELECT MAX(sequence)::text AS cursor FROM admin_order_events`);
      assert.equal(recoveredMessages.find(message => message.type === "sync").id, currentCursor, "a cursor from a newer database is reset to the current database cursor");
      const restored = await orders.create({ ...orderDto, idempotencyKey: `${slug}-cursor-recovery` });
      await waitFor(() => recoveredMessages.some(message => message.type === "order.created" && message.data.orderId === restored.id));
    } finally { recoveredStream.unsubscribe(); }
    console.log("PASS stale browser cursor recovery after a database restore/environment change");
    await db.query(`UPDATE admin_staff SET permissions='{"orders.view":"deny"}'::jsonb WHERE id=$1`, [staffIds[0]]);
    await waitFor(() => messages.some(message => message.type === "access-revoked"));
    assert.equal(stream.closed, true, "permission change ends established SSE");
    await assert.rejects(notifications.authorize(tokens[0]), error => error.getStatus() === 403);
    await db.query(`UPDATE admin_staff SET permissions='{}'::jsonb WHERE id=$1`, [staffIds[0]]);
    console.log("PASS initial sync, new-order stream and live permission revocation");

    process.env.ADMIN_VAPID_PUBLIC_KEY = "test-public";
    process.env.ADMIN_VAPID_PRIVATE_KEY = "test-private";
    process.env.ADMIN_VAPID_SUBJECT = "mailto:test@example.invalid";
    const subscriptions = tokens.map((_, index) => ({ endpoint: `https://fcm.googleapis.com/fcm/send/${slug}-${index}`, keys: { p256dh: "A".repeat(87), auth: "B".repeat(22) } }));
    for (let index = 0; index < tokens.length; index++) await notifications.subscribe(tokens[index], subscriptions[index]);
    assert.equal((await db.query(`SELECT id FROM admin_push_subscriptions WHERE "staffId"=ANY($1::uuid[])`, [staffIds])).length, 2);
    await db.query(`UPDATE admin_staff SET permissions='{"orders.view":"deny"}'::jsonb WHERE id=$1`, [staffIds[1]]);
    await assert.rejects(notifications.subscribe(tokens[1], subscriptions[1]), error => error.getStatus() === 403);
    const delivered = [];
    webpush.sendNotification = async (subscription, payload) => { delivered.push({ endpoint: subscription.endpoint, payload: JSON.parse(payload) }); return { statusCode: 201 }; };
    // Claim only this fixture's pending events; other test data is not sent.
    preservedPendingEvents = await db.query(`UPDATE admin_order_events SET "pushProcessedAt"=now() WHERE "regionSlug"<>$1 AND "pushProcessedAt" IS NULL RETURNING id`, [slug]);
    await notifications.deliverPendingPush();
    assert.equal(delivered.length, 5, "all fixture orders go only to the permitted employee");
    assert.ok(delivered.every(item => item.endpoint === subscriptions[0].endpoint));
    assert.ok(delivered.every(item => !JSON.stringify(item.payload).includes(orderDto.phone) && !JSON.stringify(item.payload).includes(orderDto.customerName)));
    await notifications.deliverPendingPush();
    assert.equal(delivered.length, 5, "processed events are not sent twice");
    await security.logout(tokens[0]);
    assert.equal((await db.query(`SELECT id FROM admin_push_subscriptions WHERE "sessionId"=$1`, [sessions[0]])).length, 0, "logout removes session-bound subscriptions");
    await assert.rejects(notifications.authorize(tokens[0]), error => error.getStatus() === 401);
    console.log("PASS current push permissions, minimal payload, no repeated sends, logout cascade");
  } finally {
    stream?.unsubscribe();
    webpush.sendNotification = originalSend;
    ["ADMIN_VAPID_PUBLIC_KEY", "ADMIN_VAPID_PRIVATE_KEY", "ADMIN_VAPID_SUBJECT"].forEach((key, index) => { if (originalVapid[index] === undefined) delete process.env[key]; else process.env[key] = originalVapid[index]; });
    if (preservedPendingEvents.length) await db.query(`UPDATE admin_order_events SET "pushProcessedAt"=NULL WHERE id=ANY($1::uuid[])`, [preservedPendingEvents.map(event => event.id)]);
    await db.query(`DELETE FROM orders WHERE "regionSlug"=$1`, [slug]);
    await db.query(`DELETE FROM admin_staff WHERE id=ANY($1::uuid[])`, [staffIds]);
    await db.query(`DELETE FROM regions WHERE slug=$1`, [slug]);
    await db.destroy();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
