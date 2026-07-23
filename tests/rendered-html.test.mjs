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
  const [storefront, catalog, categoryPage, globals, packageJson] = await Promise.all([
    readFile(new URL("../app/components/Storefront.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/category/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(storefront, /product-modal-\$\{selected\.modalKind/);
  assert.match(storefront, /className="address-modal"/);
  assert.match(storefront, /className="cart-drawer"/);
  assert.match(storefront, /aria-label="Самовывоз"/);
  assert.match(storefront, /pickup-location/);
  assert.match(storefront, /pickup-marker-disabled\.DSAcVKbt\.svg/);
  assert.match(storefront, /composition-modal/);
  assert.match(storefront, /related-actions/);
  assert.match(storefront, /addon-groups/);
  assert.match(storefront, /story-progress/);
  assert.match(storefront, /story-progress-segment/);
  assert.match(storefront, /promoPage/);
  assert.match(storefront, /className="profile-modal"/);
  assert.match(storefront, /auth-roskachestvo-banner/);
  assert.match(storefront, /searchOpen/);
  assert.match(storefront, /Что ищем\?/);
  assert.match(storefront, /b92972a55683d636714fea75d11469ce/);
  assert.match(storefront, /e258569da4e992205d8f3ae006d151eb/);
  assert.match(storefront, /ce627f513c731ba28069085078e433dc/);
  assert.match(storefront, /2720f66e5f628289ea1c761222a24eb4/);
  assert.match(storefront, /1ebd0558c6daa570f029071ce7bb1648/);
  assert.match(storefront, /30_000/);
  assert.match(storefront, /5_000/);
  assert.match(storefront, /row\.scrollTo\(\{ left: index \* 132, behavior: "smooth" \}\)/);
  assert.match(storefront, /writeOverlayQuery/);
  assert.doesNotMatch(storefront, /<button[^>]*>Комплектация<\/button>/);
  assert.match(storefront, /Увеличить количество/);
  assert.match(storefront, /NEXT_PUBLIC_API_URL/);
  assert.match(storefront, /className="footer-app"/);
  assert.match(storefront, /муниципальный округ Нижегородский/);
  assert.match(catalog, /hity-prodaz-2/);
  assert.match(catalog, /Куриный попкорн/);
  assert.match(catalog, /b8d03d4e8617466336260d917af4f21b/);
  assert.match(catalog, /f449b42a119d8d82dbaf4ec023d4bd95/);
  assert.match(catalog, /Основной соус/);
  assert.match(catalog, /referenceDetail:\s*"popcorn"/);
  assert.match(catalog, /liveProductImages\[name\] \|\| image/);
  assert.match(catalog, /3d9ab65a9c04e36fc93b2c615bf2834c/);
  assert.match(catalog, /116ebec73cfa9103dd9332b8438cd9e1/);
  assert.ok(catalog.indexOf('"Поке с тунцом", 795') < catalog.indexOf('"Поке спайси с лососем", 890'));
  assert.match(storefront, /title: "Нашли для вас"/);
  assert.match(categoryPage, /categorySlug=\{slug\}/);
  assert.match(globals, /\.product-modal\s*\{[^}]*width:\s*min\(clamp\(1160px[^}]*height:\s*min\(920px/);
  assert.match(globals, /\.product-modal-simple\s*\{[^}]*width:\s*min\(clamp\(905px/);
  assert.match(globals, /\.product-modal-simple\s*\{[^}]*height:\s*min\(920px/);
  assert.match(globals, /\.product-modal-simple \.modal-description\s*\{\s*height:\s*74px/);
  assert.match(globals, /white-space:\s*normal/);
  assert.match(globals, /url\("\/api\/inter\/cyrillic"\)/);
  assert.match(globals, /\.delivery-header\s*\{[^}]*top:\s*20px/);
  assert.match(globals, /\.category-nav\s*\{[^}]*top:\s*146px/);
  assert.match(globals, /\.footer\s*\{[^}]*background:\s*var\(--orange\)/);
  assert.match(globals, /\.pickup-map-marker\s*\{[^}]*width:\s*38px[^}]*height:\s*56px/);
  assert.match(globals, /\.store-shell\s*\{[^}]*max-width:\s*1280px/);
  assert.match(globals, /grid-template-columns:\s*repeat\(auto-fill, minmax\(180px, 1fr\)\)/);
  assert.match(globals, /\.catalog\s*\{[^}]*width:\s*calc\(100%\s*-\s*64px\)/);
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
