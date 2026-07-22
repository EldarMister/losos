import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the storefront", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Много лосося \| Суши, пиццы, роллы<\/title>/i);
  assert.match(html, /Salmon Lovers Club/);
  assert.match(html, /Новинки/);
  assert.match(html, /Шаурокинава/);
  assert.match(html, /Корзина/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("includes the product, cart and address flows", async () => {
  const [storefront, catalog, categoryPage, packageJson] = await Promise.all([
    readFile(new URL("../app/components/Storefront.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/category/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(storefront, /product-modal-\$\{selected\.modalKind/);
  assert.match(storefront, /className="address-modal"/);
  assert.match(storefront, /className="cart-drawer"/);
  assert.match(storefront, /aria-label="Самовывоз"/);
  assert.match(storefront, /pickup-location/);
  assert.match(storefront, /composition-modal/);
  assert.match(storefront, /related-actions/);
  assert.match(storefront, /addon-groups/);
  assert.match(storefront, /story-progress/);
  assert.match(storefront, /30_000/);
  assert.match(storefront, /writeOverlayQuery/);
  assert.doesNotMatch(storefront, /Комплектация/);
  assert.match(storefront, /Увеличить количество/);
  assert.match(storefront, /NEXT_PUBLIC_API_URL/);
  assert.match(catalog, /hity-prodaz-2/);
  assert.match(catalog, /Куриный попкорн/);
  assert.match(catalog, /Основной соус/);
  assert.match(catalog, /referenceDetail:\s*"popcorn"/);
  assert.match(categoryPage, /categorySlug=\{slug\}/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});

test("NestJS and PostgreSQL project files are present", async () => {
  const [moduleSource, compose, orderSource] = await Promise.all([
    readFile(new URL("../server/src/app.module.ts", import.meta.url), "utf8"),
    readFile(new URL("../docker-compose.yml", import.meta.url), "utf8"),
    readFile(new URL("../server/src/orders/orders.service.ts", import.meta.url), "utf8"),
  ]);
  assert.match(moduleSource, /type:\s*"postgres"/);
  assert.match(compose, /postgres:16-alpine/);
  assert.match(orderSource, /this\.orders\.save/);
});
