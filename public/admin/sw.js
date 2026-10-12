/* NAKTA admin only. Never cache API responses or personalized HTML. */
const VERSION = "nakta-admin-static-v3";
const STATIC = ["/admin/offline.html", "/admin/app-icon.png", "/admin/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(STATIC)));
  // Updates deliberately remain waiting until the employee confirms.
});
self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("nakta-admin-static-") && key !== VERSION).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate" && (url.pathname === "/admin" || url.pathname.startsWith("/admin/"))) {
    event.respondWith(fetch(new Request(request, { cache: "no-store" })).catch(async () => (await caches.match("/admin/offline.html")) || Response.error()));
    return;
  }
  // Only explicitly public assets and immutable Next build chunks are eligible.
  const immutableChunk = /^\/_next\/static\/(?:chunks|css)\/(?:[^/]+\/)*[a-f0-9]{8,}(?:[.-][a-f0-9]+)?\.(?:js|css)$/.test(url.pathname);
  if (STATIC.includes(url.pathname) || immutableChunk) {
    event.respondWith(caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === "basic") await cache.put(request, response.clone());
      return response;
    }));
  }
});

function stateDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("nakta-admin-notifications", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("state");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function writeState(key, value) {
  const db = await stateDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    tx.objectStore("state").put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
async function claimPush(eventId) {
  const db = await stateDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    const store = tx.objectStore("state");
    let claimed = false;
    const enabled = store.get("enabled");
    enabled.onsuccess = () => {
      if (enabled.result !== true) return;
      const request = store.get("seen");
      request.onsuccess = () => {
        const seen = (request.result || []).filter((entry) => entry.at > Date.now() - 86400000);
        if (seen.some((entry) => entry.id === eventId)) return;
        seen.push({ id: eventId, at: Date.now() });
        store.put(seen.slice(-500), "seen");
        claimed = true;
      };
    };
    tx.oncomplete = () => { db.close(); resolve(claimed); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") event.waitUntil(self.skipWaiting());
  if (event.data?.type === "PUSH_ENABLED") event.waitUntil(writeState("enabled", true));
  if (event.data?.type === "LOGOUT" || event.data?.type === "PUSH_DISABLED") event.waitUntil(Promise.all([
    writeState("enabled", false),
    self.registration.getNotifications().then((notifications) => notifications.forEach((notification) => notification.close())),
  ]));
});
self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let data;
    try { data = event.data?.json(); } catch { return; }
    if (!data?.eventId || !data?.orderId || !await claimPush(data.eventId)) return;
    await self.registration.showNotification("Новый заказ · NAKTA", {
      body: `Заказ №${Number(data.orderNumber) || ""} ожидает обработки`,
      icon: "/admin/app-icon.png", badge: "/admin/app-icon.png",
      tag: `nakta-order:${data.eventId}`, renotify: false,
      data: { url: `/admin?section=orders&order=${encodeURIComponent(data.orderId)}` },
    });
  })());
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const target = new URL(event.notification.data?.url || "/admin", self.location.origin);
    if (target.origin !== self.location.origin || target.pathname !== "/admin") return;
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const client = clients.find((item) => new URL(item.url).pathname === "/admin");
    // An open panel owns navigation so it can protect unsaved forms. Newly
    // opened pages run their normal session and permission checks.
    if (client) { await client.focus(); client.postMessage({ type: "OPEN_ADMIN_ORDER", url: target.href }); }
    else await self.clients.openWindow(target.href);
  })());
});
