import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_SESSION_KEY, clearAdminSession, readAdminSession, saveAdminSession } from "../../app/admin/admin-session";
import { activateAdminUpdate } from "../../app/admin/notifications/app-update";

const token = "a".repeat(64);
function store() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
}

test("login survives a new tab and old tab sessions migrate without losing access", () => {
  const persistent = store();
  const temporary = store();
  temporary.setItem(ADMIN_SESSION_KEY, token);
  assert.equal(readAdminSession({ persistent, temporary }), token);
  assert.equal(temporary.getItem(ADMIN_SESSION_KEY), null);
  assert.equal(readAdminSession({ persistent, temporary: store() }), token);
  clearAdminSession(token, { persistent, temporary });
  assert.equal(readAdminSession({ persistent, temporary: store() }), "");
});

test("blocked storage keeps the current tab usable and stale logout cannot erase a newer account", () => {
  const temporary = store();
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  saveAdminSession(token, { persistent: blocked, temporary });
  assert.equal(readAdminSession({ persistent: blocked, temporary }), token);
  const persistent = store();
  const newer = "b".repeat(64);
  persistent.setItem(ADMIN_SESSION_KEY, newer);
  clearAdminSession(token, { persistent, temporary });
  assert.equal(persistent.getItem(ADMIN_SESSION_KEY), newer);
  assert.equal(temporary.getItem(ADMIN_SESSION_KEY), null);
  persistent.setItem(ADMIN_SESSION_KEY, "invalid");
  assert.equal(readAdminSession({ persistent, temporary }), "");
});

test("update reloads once on worker activation, even if fallback fires later", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const events = new EventTarget();
  const messages: unknown[] = [];
  let reloads = 0;
  activateAdminUpdate(events, { postMessage: message => messages.push(message) }, () => reloads++);
  assert.deepEqual(messages, [{ type: "ACTIVATE_UPDATE" }]);
  events.dispatchEvent(new Event("controllerchange"));
  t.mock.timers.tick(4000);
  events.dispatchEvent(new Event("controllerchange"));
  assert.equal(reloads, 1);
});

test("stale workers, missing activation events and postMessage errors cannot leave update stuck", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const events = new EventTarget();
  let reloads = 0;
  activateAdminUpdate(events, { postMessage() {} }, () => reloads++);
  t.mock.timers.tick(2999);
  assert.equal(reloads, 0);
  t.mock.timers.tick(1);
  assert.equal(reloads, 1);
  activateAdminUpdate(events, null, () => reloads++);
  assert.equal(reloads, 2);
  activateAdminUpdate(events, { postMessage() { throw new Error("redundant worker"); } }, () => reloads++);
  assert.equal(reloads, 3);
  const cancel = activateAdminUpdate(events, { postMessage() {} }, () => reloads++);
  cancel();
  events.dispatchEvent(new Event("controllerchange"));
  t.mock.timers.tick(4000);
  assert.equal(reloads, 3);
});
