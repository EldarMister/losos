import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { claimOrderSound, orderEventCursor, parseSseFrame } from "../../app/admin/notifications/event-dedup";
import { isAllowedPushEndpoint, validEventCursor } from "../src/admin/notifications/admin-notification-policy";

const now = 1_800_000_000_000;
const event = { id: "stable-event-1", orderId: "order-1", orderNumber: 43, createdAt: new Date(now).toISOString(), audible: true };
function browserPorts() {
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  const queues = new Map<string, Promise<unknown>>();
  const locks = { request<T>(key: string, callback: () => T | Promise<T>): Promise<T> {
    const current = (queues.get(key) || Promise.resolve()).then(callback);
    queues.set(key, current.catch(() => undefined));
    return current;
  } };
  return { storage, locks };
}

test("one stable event is audible once across concurrent tabs and reconnect", async () => {
  const { storage, locks } = browserPorts();
  const result = await Promise.all(Array.from({ length: 12 }, () => claimOrderSound("employee-1", event, storage, locks, now)));
  assert.equal(result.filter(Boolean).length, 1);
  assert.equal(await claimOrderSound("employee-1", event, storage, locks, now + 1000), false);
  assert.equal(await claimOrderSound("employee-1", { ...event, id: "second-order" }, storage, locks, now + 1000), true);
});
test("initial synchronization, old backlog, invalid dates and unsupported locking stay silent", async () => {
  const { storage, locks } = browserPorts();
  assert.equal(await claimOrderSound("employee-1", { ...event, audible: false }, storage, locks, now), false);
  assert.equal(await claimOrderSound("employee-1", event, storage, locks, now + 31_000), false);
  assert.equal(await claimOrderSound("employee-1", { ...event, createdAt: "invalid" }, storage, locks, now), false);
  assert.equal(await claimOrderSound("employee-1", event, storage, undefined, now), false);
});
test("notification preferences/dedup are isolated by employee", async () => {
  const { storage, locks } = browserPorts();
  assert.equal(await claimOrderSound("employee-1", event, storage, locks, now), true);
  assert.equal(await claimOrderSound("employee-2", event, storage, locks, now), true);
});
test("SSE parser tolerates heartbeat comments, CRLF and multiline JSON", () => {
  assert.equal(parseSseFrame(":keepalive"), null);
  assert.deepEqual(parseSseFrame('id: 42\r\nevent: order.created\r\ndata: {"id":"event",\r\ndata: "orderNumber":43}\r\n'), {
    id: "42", type: "order.created", data: { id: "event", orderNumber: 43 },
  });
  assert.equal(parseSseFrame("event: broken\ndata: not-json"), null);
});

test("heartbeat transport IDs never advance the persisted order cursor", () => {
  let cursor = "20";
  for (let id = 1; id < 200; id++) {
    const heartbeat = parseSseFrame(`event: heartbeat\nid: ${id}\ndata: {"at":"now"}`);
    cursor = orderEventCursor(heartbeat!) || cursor;
  }
  assert.equal(cursor, "20");
  assert.equal(orderEventCursor({ type: "access-revoked", id: "200" }), undefined);
  assert.equal(orderEventCursor({ type: "sync", id: "0" }), "0");
  assert.equal(orderEventCursor({ type: "order.created", id: "21" }), "21");
  assert.equal(orderEventCursor({ type: "order.created", id: "invalid" }), undefined);
});
test("push endpoints cannot target local services or attacker-controlled hosts", () => {
  for (const endpoint of ["http://fcm.googleapis.com/send", "https://localhost/admin", "https://127.0.0.1", "https://fcm.googleapis.com.evil.test/", "https://user@fcm.googleapis.com/", "https://fcm.googleapis.com:444/"]) assert.equal(isAllowedPushEndpoint(endpoint), false, endpoint);
  for (const endpoint of ["https://fcm.googleapis.com/fcm/send/token", "https://updates.push.services.mozilla.com/wpush/v2/token", "https://web.push.apple.com/token", "https://wns2.notify.windows.com/token"]) assert.equal(isAllowedPushEndpoint(endpoint), true, endpoint);
  assert.equal(validEventCursor("123"), "123");
  assert.equal(validEventCursor("-1"), undefined);
  assert.equal(validEventCursor("1;DROP TABLE orders"), undefined);
});

test("notification clicks preserve open editors and only open same-origin admin pages", async () => {
  const handlers = new Map<string, (event: unknown) => void>();
  const opened: string[] = [];
  const messages: { type: string; url: string }[] = [];
  let focused = false;
  let existing = true;
  const client = {
    url: "https://nakta.example/admin?section=menu",
    focus: async () => { focused = true; },
    postMessage: (message: { type: string; url: string }) => messages.push(message),
    navigate: () => { assert.fail("Worker must not discard an open editor by navigating directly"); },
  };
  runInNewContext(readFileSync("public/admin/sw.js", "utf8"), {
    URL,
    self: {
      location: { origin: "https://nakta.example" },
      addEventListener: (name: string, handler: (event: unknown) => void) => handlers.set(name, handler),
      clients: { matchAll: async () => existing ? [client] : [], openWindow: async (url: string) => opened.push(url) },
    },
  });
  async function click(url: string) {
    let done: Promise<void> | undefined;
    handlers.get("notificationclick")!({ notification: { data: { url }, close() {} }, waitUntil: (promise: Promise<void>) => { done = promise; } });
    await done;
  }
  const target = "https://nakta.example/admin?section=orders&order=test-order";
  await click(target);
  assert.equal(focused, true);
  assert.equal(messages[0].type, "OPEN_ADMIN_ORDER");
  assert.equal(messages[0].url, target);
  assert.equal(opened.length, 0);
  existing = false;
  await click(target);
  assert.deepEqual(opened, [target]);
  await click("https://attacker.example/admin?section=orders&order=test-order");
  await click("https://nakta.example/customer-account");
  assert.equal(opened.length, 1, "notification targets cannot escape the admin page");
});

test("service worker never caches mutable development chunks or admin API data", async () => {
  const handlers = new Map<string, (event: unknown) => void>();
  let cacheRequests = 0;
  runInNewContext(readFileSync("public/admin/sw.js", "utf8"), {
    URL,
    caches: { open: async () => ({ match: async () => { cacheRequests++; return { ok: true }; } }) },
    self: { location: { origin: "https://nakta.example" }, addEventListener: (name: string, handler: (event: unknown) => void) => handlers.set(name, handler) },
  });
  for (const path of ["/_next/static/chunks/main-app.js", "/_next/static/chunks/app/admin/page.js", "/_next/static/development/_buildManifest.js", "/api/admin/orders"]) {
    handlers.get("fetch")!({ request: { method: "GET", mode: "cors", url: `https://nakta.example${path}` }, respondWith: () => assert.fail(`Must not cache ${path}`) });
  }
  const pending: Promise<unknown>[] = [];
  handlers.get("fetch")!({ request: { method: "GET", mode: "cors", url: "https://nakta.example/_next/static/chunks/a1b2c3d4.js" }, respondWith: (value: Promise<unknown>) => pending.push(value) });
  await Promise.all(pending);
  assert.equal(cacheRequests, 1, "only a clearly content-hashed chunk is cacheable");
});
