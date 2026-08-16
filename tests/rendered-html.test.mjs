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
  assert.match(
    html,
    /<title>Доставка суши и роллов в Бишкеке и Оше \| Накта суши<\/title>/i,
  );
  assert.match(html, /<link rel="canonical" href="https:\/\/naktasushi\.com\/"/i);
  assert.match(html, /application\/ld\+json/i);
  assert.match(html, /Salmon Lovers Club/);
  assert.match(html, /Соус сладкий васаби/);
  assert.match(html, /Корзина/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("renders the public legal documents", async () => {
  for (const [pathname, heading] of [
    ["/privacy", "Политика конфиденциальности"],
    ["/terms", "Условия использования и заказа"],
    ["/delete-account", "Удаление аккаунта"],
  ]) {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    assert.match(await response.text(), new RegExp(`<h1[^>]*>${heading}</h1>`, "i"));
  }
});

test("renders the mobile CAPTCHA bridge", async () => {
  const response = await render("/mobile-captcha");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Проверка безопасности Накта суши/);

  const source = await readFile(
    new URL("../app/mobile-captcha/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /window\.ReactNativeWebView\?\.postMessage/);
  assert.match(source, /type:\s*"success"/);
});

test("exposes the frontend healthcheck used by Railway", async () => {
  const response = await render("/api/health");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", service: "nakta-sushi-web" });
});

test("includes the product, cart and address flows", async () => {
  const [storefront, yandexMap, mapsConfigRoute, serverEnv, envExample, catalog, categoryPage, globals, packageJson, railwayConfig, robots, sitemap, seo] = await Promise.all([
    readFile(new URL("../app/components/Storefront.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/YandexDeliveryMap.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/maps-config/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/server-env.ts", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../app/data/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/category/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../railway.json", import.meta.url), "utf8"),
    readFile(new URL("../app/robots.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/seo.ts", import.meta.url), "utf8"),
  ]);

  assert.match(storefront, /product-modal-\$\{selected\.modalKind/);
  assert.match(storefront, /className="address-modal"/);
  assert.match(storefront, /className="cart-drawer"/);
  assert.match(storefront, /aria-label="Самовывоз"/);
  assert.match(storefront, /pickup-location/);
  assert.match(storefront, /<YandexDeliveryMap/);
  assert.match(storefront, /deliveryLocation/);
  assert.match(storefront, /Заказать сюда/);
  assert.match(storefront, /disabled=\{!deliveryLocation\}/);
  assert.match(yandexMap, /api-maps\.yandex\.ru\/2\.1/);
  assert.doesNotMatch(yandexMap, /key_revision|csp:\s*"202512"/);
  assert.match(yandexMap, /suggest-maps\.yandex\.ru\/v1\/suggest/);
  assert.match(yandexMap, /createPortal/);
  assert.match(yandexMap, /geocodeViaApi/);
  assert.match(yandexMap, /restrictMapArea:\s*config\.bounds/);
  assert.match(yandexMap, /map\.events\.add\("click"/);
  assert.match(yandexMap, /placemark\.events\.add\("dragend"/);
  assert.match(yandexMap, /addressWithoutCity/);
  assert.match(yandexMap, /delivery-map-marker/);
  assert.match(yandexMap, /fitToViewport/);
  assert.equal((yandexMap.match(/new ResizeObserver/g) || []).length, 2);
  assert.match(yandexMap, /pendingCenter/);
  assert.match(yandexMap, /map\?\.setCenter\(point, zoom\);/);
  assert.doesNotMatch(yandexMap, /setCenter\(point, zoom, \{ duration:/);
  assert.match(storefront, /aria-label="Очистить адрес"/);
  assert.doesNotMatch(storefront, /aria-label="Найти адрес"/);
  assert.match(yandexMap, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(yandexMap, /bishkek:[\s\S]*osh:/);
  assert.match(mapsConfigRoute, /YANDEX_MAPS_API_KEY/);
  assert.match(mapsConfigRoute, /YANDEX_SUGGEST_API_KEY/);
  assert.match(mapsConfigRoute, /readServerEnv/);
  assert.match(serverEnv, /globalThis[\s\S]*process\?/);
  assert.match(mapsConfigRoute, /Cache-Control/);
  assert.match(envExample, /YANDEX_MAPS_API_KEY=/);
  assert.match(envExample, /YANDEX_SUGGEST_API_KEY=/);
  assert.match(envExample, /SITE_URL=https:\/\/naktasushi\.com/);
  assert.match(storefront, /composition-modal/);
  assert.match(storefront, /related-actions/);
  assert.match(storefront, /className="product-name-row"[\s\S]*?className="product-nakta-badge"/);
  assert.match(storefront, /className="modal-description-header"[\s\S]*?className="product-nakta-badge modal-nakta-badge"/);
  assert.match(globals, /\.product-name-row\s*\{[^}]*display:\s*flex/);
  assert.match(globals, /\.modal-description-header\s*\{[^}]*display:\s*flex/);
  assert.match(storefront, /modifier-groups/);
  assert.match(storefront, /Настройте блюдо/);
  assert.match(storefront, /story-progress/);
  assert.match(storefront, /story-progress-segment/);
  assert.match(storefront, /promoPage/);
  assert.match(storefront, /profile-modal\$\{profileSection === "orders" \? " profile-orders-screen"/);
  assert.match(globals, /\.profile-modal\.profile-orders-screen \{ width: 100vw;/);
  assert.match(storefront, /\/auth\/orders\/\$\{encodeURIComponent\(selectedProfileOrder\.id\)\}\/cancel/);
  assert.match(storefront, />Отменить заказ<\/button>/);
  assert.match(storefront, /После отмены восстановить заказ не получится\./);
  assert.match(globals, /\.order-cancel-confirm/);
  assert.doesNotMatch(storefront, /auth-roskachestvo-banner/);
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
  assert.match(storefront, />Комплектация<\/button>/);
  assert.match(storefront, /Увеличить количество/);
  assert.match(storefront, /NEXT_PUBLIC_API_URL/);
  assert.match(storefront, /https:\/\/losos-production\.up\.railway\.app\/api/);
  assert.match(storefront, /cartLineKey/);
  assert.match(storefront, /selectedModifiersForCart/);
  assert.match(storefront, /line\.modifiers/);
  assert.match(storefront, /className="checkout-drawer"/);
  assert.match(storefront, /className="checkout-address-card"/);
  assert.match(storefront, /className="checkout-recipient-card"/);
  assert.match(storefront, /className="checkout-total-block"/);
  assert.match(storefront, /paymentMethod: "cash"/);
  assert.match(globals, /\.checkout-footer \{ position: absolute;/);
  assert.match(storefront, /className="phone-auth-modal"/);
  assert.match(storefront, /Войдите или зарегистрируйтесь/);
  assert.match(storefront, /<TurnstileWidget/);
  assert.match(storefront, /import \{ Icon \} from "@mdi\/react"/);
  assert.doesNotMatch(storefront, /import Icon from "@mdi\/react"/);
  assert.doesNotMatch(storefront, /WhatsApp/i);
  assert.doesNotMatch(storefront, /\/auth\/whatsapp\//);
  assert.match(storefront, /mdiShoppingOutline/);
  assert.match(storefront, /mdiLogout/);
  assert.match(storefront, />Выйти /);
  assert.match(storefront, /PHONE_AUTH_SESSION_STORAGE_KEY/);
  assert.match(storefront, /className="cart-kit-modal"/);
  assert.match(storefront, /kitItems: cartKitItems\.map/);
  assert.match(storefront, /setKitQuantities/);
  assert.match(storefront, /orderingClosed \? "Закрыто" : "Далее"/);
  assert.match(storefront, /className="delivery-info-sheet"/);
  assert.match(storefront, /setDeliveryInfoOpen\(true\)/);
  assert.match(storefront, /freeDeliveryThreshold/);
  assert.match(storefront, /address-panel-expanded/);
  assert.match(globals, /\.address-panel\.address-panel-expanded \{ flex-basis: min\(520px, 64dvh\); height: min\(520px, 64dvh\); \}/);
  assert.equal(JSON.parse(railwayConfig).build.buildCommand, "npm run build");
  assert.equal(JSON.parse(railwayConfig).deploy.startCommand, "npm start");
  assert.equal(JSON.parse(railwayConfig).deploy.healthcheckPath, "/api/health");
  assert.ok(
    storefront.indexOf('orderingClosed ? "Закрыто" : "Далее"') < storefront.indexOf('className="phone-auth-modal"'),
    "SMS authorization must follow the cart",
  );
  assert.ok(
    storefront.indexOf('className="phone-auth-modal"') < storefront.indexOf('className="checkout-drawer"'),
    "checkout must open after SMS authorization",
  );
  assert.doesNotMatch(storefront, /className=\{`checkout-phone-auth/);
  assert.match(storefront, /submitOrder/);
  assert.match(storefront, /idempotencyKey/);
  assert.match(storefront, /fetch\(`\$\{orderApiUrl\}\/orders`/);
  assert.match(storefront, /setCatalogCategories\(categories\)/);
  assert.match(storefront, /setRegionalPromotions\(null\)/);
  assert.match(storefront, /STOREFRONT_STORAGE_KEY/);
  assert.match(storefront, /parseStoredStorefrontState/);
  assert.match(storefront, /window\.localStorage\.getItem/);
  assert.match(storefront, /window\.localStorage\.setItem/);
  assert.match(storefront, /value\.regionSlug !== regionSlug/);
  assert.match(storefront, /candidate\.quantity === undefined \? 1 : candidate\.quantity/);
  assert.match(storefront, /\$\{modifier\.groupId\}:\$\{modifier\.itemId\}:\$\{modifier\.quantity\}/);
  assert.match(storefront, /modifier\.price \* modifier\.quantity/);
  assert.match(storefront, /quantity: modifier\.quantity/);
  assert.match(storefront, /changeModifierQuantity/);
  assert.match(storefront, /modifierQuantity >= maximumQuantity/);
  assert.match(storefront, /MAX_MODIFIER_ITEM_QUANTITY = 99/);
  assert.match(storefront, /MAX_MODIFIER_UNITS = 500/);
  assert.match(storefront, /modifier\.priceScope === "per-product" \? productQuantity : 1/);
  assert.match(storefront, /priceScope: group\.priceScope \?\? "per-product"/);
  assert.match(storefront, /configuredProductTotal/);
  assert.match(storefront, /selectedModifierUnits >= MAX_MODIFIER_UNITS/);
  assert.match(storefront, /alreadySelected \? \{\} : \{ \[itemId\]: 1 \}/);
  assert.match(storefront, /Object\.values\(groupSelections\)\.filter\(\(quantity\) => quantity > 0\)\.length/);
  assert.match(storefront, /group\.required && selectedItems < minimumSelections/);
  assert.match(storefront, /modifier\.itemName\} ×\{modifier\.quantity\}/);
  assert.match(storefront, /`\$\{modifier\.itemName\} ×\$\{modifier\.quantity\}`/);
  assert.match(storefront, /group\.presentation \?\? "rows"/);
  assert.match(storefront, /modifier-presentation-\$\{presentation\}/);
  assert.match(storefront, /setUtensilsCount\(restored\.utensilsCount\)/);
  assert.match(storefront, /utensilsCount: Math\.min\(20, Math\.max\(0, utensilsCount\)\)/);
  assert.match(storefront, /disabled=\{noUtensils \|\| utensilsCount >= 20\}/);
  assert.match(storefront, /isValidDeliveryCoordinates/);
  assert.match(storefront, /value\[0\] >= -90/);
  assert.match(storefront, /value\[0\] <= 90/);
  assert.match(storefront, /value\[1\] >= -180/);
  assert.match(storefront, /value\[1\] <= 180/);
  assert.match(storefront, /setDeliveryLocation\(restored\.deliveryLocation\)/);
  assert.match(storefront, /latitude: deliveryLocation\.coordinates\[0\]/);
  assert.match(storefront, /longitude: deliveryLocation\.coordinates\[1\]/);
  assert.match(storefront, /\(quantity as number\) > 20/);
  assert.match(storefront, /quantity: Math\.min\(20, Math\.max\(1, line\.quantity\)\)/);
  assert.match(storefront, /quantity: Math\.min\(20, line\.quantity \+ quantity\)/);
  assert.match(storefront, /disabled=\{modalQuantity >= 20\}/);
  assert.match(storefront, /disabled=\{line\.quantity >= 20\}/);
  assert.match(storefront, /if \(product\.available === false\) return/);
  assert.match(storefront, /product\.available === false \|\| !Number\.isInteger\(quantity\)/);
  assert.match(storefront, /aria-disabled=\{product\.available === false\}/);
  assert.match(storefront, /item\.slug === productSlug && item\.available !== false/);
  assert.match(storefront, /disabled=\{selected\.available === false \|\| !modifiersComplete\}/);
  assert.match(storefront, /className="footer-app-link footer-app-nakta"/);
  assert.match(storefront, /0503 178 916/);
  assert.match(storefront, /musaev\.janybek\.kg@gmail\.com/);
  assert.match(storefront, /format\(value\) \+ " сом"/);
  assert.match(storefront, /const cartLocation = address\.trim\(\)/);
  assert.match(storefront, /const cartKitItems = \[/);
  assert.match(storefront, /if \(mode === "cart"\) \{\s*return <img src=\{product\.image\}/);
  assert.match(catalog, /hity-prodaz-2/);
  assert.match(catalog, /Соус сладкий васаби/);
  assert.match(catalog, /"Зелёный", 590/);
  assert.match(catalog, /b8d03d4e8617466336260d917af4f21b/);
  assert.match(catalog, /f449b42a119d8d82dbaf4ec023d4bd95/);
  assert.match(catalog, /Основной соус/);
  assert.match(catalog, /selectionType:\s*"single"/);
  assert.match(catalog, /modalKind:\s*"simple"/);
  assert.match(catalog, /productMetaByName\[name\]/);
  assert.match(catalog, /available:\s*false/);
  assert.match(catalog, /liveProductImages\[name\] \|\| image/);
  assert.match(catalog, /3d9ab65a9c04e36fc93b2c615bf2834c/);
  assert.match(catalog, /116ebec73cfa9103dd9332b8438cd9e1/);
  assert.ok(catalog.indexOf('"Поке спайси с лососем", 890') < catalog.indexOf('"Поке с тунцом", 795'));
  assert.match(storefront, /title: "Нашли для вас"/);
  assert.match(storefront, /const promotionsToStories = \(promotions: Promotion\[\]\)/);
  assert.doesNotMatch(storefront, /promotionArtifactTitles|reconcilePromotions/);
  assert.match(storefront, /if \(mode === "detail"\) \{\s*return <img src=\{product\.image\}/);
  assert.match(storefront, /if \(mode === "related"\) \{\s*return <img src=\{product\.image\}/);
  assert.match(categoryPage, /categorySlug=\{slug\}/);
  assert.match(categoryPage, /generateMetadata/);
  assert.match(categoryPage, /BreadcrumbList/);
  assert.match(robots, /disallow:\s*\["\/admin", "\/api\/"\]/);
  assert.match(robots, /sitemap:\s*absoluteUrl\("\/sitemap\.xml"\)/);
  assert.match(sitemap, /getSeoCategories/);
  assert.match(sitemap, /priority:\s*0\.8/);
  assert.match(seo, /process\.env\.SITE_URL/);
  assert.match(globals, /\.product-modal\s*\{[^}]*width:\s*min\(1160px[^}]*height:\s*min\(920px/);
  assert.match(globals, /\.modal-info\s*\{[^}]*scrollbar-width:\s*none/);
  assert.match(globals, /\.related-row\s*\{[^}]*gap:\s*16px/);
  assert.match(globals, /\.product-modal-simple\s*\{[^}]*width:\s*min\(905px/);
  assert.match(globals, /\.product-modal-simple \.modal-description\s*\{\s*height:\s*74px/);
  assert.match(globals, /white-space:\s*normal/);
  assert.match(globals, /url\("\/api\/inter\/cyrillic"\)/);
  assert.match(globals, /\.delivery-header\s*\{[^}]*top:\s*12px/);
  assert.match(globals, /\.category-nav\s*\{[^}]*top:\s*82px/);
  assert.match(globals, /\.footer\s*\{[^}]*background:\s*var\(--orange\)/);
  assert.match(globals, /\.cart-drawer\[data-filled="true"\]\s*\{[^}]*width:\s*min\(816px/);
  assert.match(globals, /\.modal-buy\s*\{[^}]*height:\s*56px[^}]*grid-template-columns:\s*142px/);
  assert.match(globals, /\.chopsticks-icon\s*\{/);
  assert.match(storefront, /className="trash-icon"/);
  assert.match(globals, /\.checkout-drawer\s*\{/);
  assert.match(globals, /\.checkout-submit\s*\{/);
  assert.match(globals, /\.delivery-info-sheet\s*\{/);
  assert.match(globals, /\.address-panel\.address-panel-expanded\s*\{/);
  assert.match(storefront, /draftAddress\.trim\(\) && !deliveryLocation \? " address-panel-expanded"/);
  assert.match(globals, /\.pickup-map-marker\s*\{[^}]*width:\s*38px[^}]*height:\s*56px/);
  assert.match(globals, /\.store-shell\s*\{[^}]*width:\s*min\(1280px/);
  assert.match(globals, /\.store-shell\.header-pinned::after\s*\{[^}]*z-index:\s*24[^}]*height:\s*70px/);
  assert.match(globals, /\.product-image-wrap img\s*\{[^}]*width:\s*100%[^}]*height:\s*100%/);
  assert.match(globals, /\.product-image-wrap::after\s*\{\s*content:\s*none/);
  assert.match(globals, /grid-template-columns:\s*repeat\(auto-fill, minmax\(180px, 1fr\)\)/);
  assert.match(globals, /\.catalog\s*\{[^}]*width:\s*min\(1216px,\s*calc\(100%\s*-\s*64px\)\)/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(packageJson, /"build":\s*"next build"/);
  assert.match(packageJson, /"start":\s*"next start"/);
  assert.match(packageJson, /"build:vinext":\s*"vinext build"/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});

test("admin exposes a dense CRM workspace, server search, loyalty, and integrations", async () => {
  const [admin, adminCss, navigation, ordersWorkspace, loyalty, customers, integrations] = await Promise.all([
    readFile(new URL("../app/admin/AdminApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/admin.css", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/AdminNavigation.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/OrdersWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/LoyaltyCenter.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/CustomersView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/IntegrationsView.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(navigation, /label: "Заказы"[\s\S]*?label: "Каталог"[\s\S]*?label: "Клиенты"[\s\S]*?label: "Лояльность"[\s\S]*?label: "Аналитика"[\s\S]*?label: "Акции"[\s\S]*?label: "Филиалы"[\s\S]*?label: "Интеграции"/);
  assert.match(navigation, /NAKTA[\s\S]*?KITCHEN/);
  assert.doesNotMatch(navigation, /admin-sidebar-branch|Администратор|admin-admin-avatar/);
  assert.match(navigation, /admin-rail-logout[\s\S]*?>Выйти</);
  assert.match(navigation, /admin-sidebar-rail[\s\S]*?data-tooltip/);
  assert.match(admin, /useState<Tab>\("orders"\)/);
  assert.match(admin, /tab === "orders" \? <OrdersWorkspace/);
  assert.match(ordersWorkspace, /admin-orders-commandbar[\s\S]*?admin-orders-kanban[\s\S]*?admin-orders-table/);
  assert.match(ordersWorkspace, /aria-label="Тип заказа"/);
  assert.match(ordersWorkspace, /admin-orders-card-delivery[\s\S]*?admin-orders-card-foot/);
  assert.doesNotMatch(ordersWorkspace, /admin-orders-filter-button|Новый заказ/);
  assert.doesNotMatch(admin, /admin-notification-button|mdiBellOutline/);
  assert.doesNotMatch(admin, /admin-settings-city"><i/);
  assert.match(admin, /baseQuery\.set\("search", deferredSearch\.trim\(\)\)/);
  assert.match(admin, /\/admin\/analytics\?\$\{query\}/);
  assert.match(admin, /tab === "categories"[\s\S]*?Добавить категорию/);
  assert.match(admin, /openCategory\(category\)/);
  assert.match(admin, /tab === "customers"[\s\S]*?<CustomersView/);
  assert.match(admin, /tab === "loyalty"[\s\S]*?<LoyaltyCenter/);
  assert.match(admin, /tab === "integrations"[\s\S]*?<IntegrationsView/);
  assert.match(loyalty, /Выдавать каждые N заказов/);
  assert.match(loyalty, /NFT и выводы/);
  assert.match(loyalty, /Настроить награды в каталоге/);
  assert.doesNotMatch(loyalty, /admin-kpi-grid/);
  assert.match(customers, /NAKTA Coin[\s\S]*?<th>NFT<\/th>/);
  assert.doesNotMatch(customers, /admin-kpi-grid/);
  assert.match(integrations, /Получить меню/);
  assert.match(integrations, /NFT Transfer/);
  assert.doesNotMatch(integrations, /admin-integration-hero/);
  const eduPosImportHandler = admin.slice(
    admin.indexOf("const importEduPosMenu"),
    admin.indexOf("const exportEduPosMenu"),
  );
  assert.ok(
    eduPosImportHandler.indexOf("await loadDashboard()") < eduPosImportHandler.indexOf("EDU POS: сопоставлено"),
    "EDU POS import result must be shown after refreshing the dashboard",
  );
  assert.match(admin, /Начало рабочего дня/);
  assert.match(admin, /Бесплатная доставка от, сом/);
  assert.match(admin, /className="admin-order-detail-body"/);
  assert.match(admin, /admin-catalog-kpis/);
  assert.match(admin, /className="admin-order-info-pane"/);
  assert.match(admin, /className="admin-order-items-pane"[\s\S]*?Состав заказа/);
  assert.match(admin, /\/admin\/orders\/\$\{selectedOrder\.id\}\/kit/);
  assert.match(admin, /className="admin-order-kit-editor"/);
  assert.match(admin, /formatPosOrderNumber\(selectedOrder\.posOrderNumber\)/);
  assert.match(admin, /modifier\.groupTitle[\s\S]*?modifier\.itemName/);
  assert.match(admin, /Итого \/ К оплате/);
  assert.match(adminCss, /\.admin-crm-sidebar/);
  assert.match(adminCss, /\.admin-data-table/);
  assert.match(adminCss, /\.admin-orders-kanban/);
  assert.match(adminCss, /--admin-sidebar-width:\s*64px/);
  assert.match(adminCss, /--admin-sidebar-width:\s*clamp\(156px, 11vw, 180px\)/);
  assert.match(adminCss, /@media\s*\(max-width:\s*980px\)/);
  assert.match(adminCss, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.admin-order-detail/);
});

test("website profile keeps NAKTA Coin and NFT balances separate and supports wallet withdrawal", async () => {
  const [storefront, globals] = await Promise.all([
    readFile(new URL("../app/components/Storefront.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(storefront, /type ProfileNftStatus = "owned" \| "pending" \| "submitted" \| "withdrawn" \| "failed"/);
  assert.match(storefront, /Ваш баланс[\s\S]*?Ваши NFT/);
  assert.match(storefront, /\/auth\/nfts\/\$\{encodeURIComponent\(nft\.id\)\}\/withdraw/);
  assert.match(storefront, /Authorization: `Bearer \$\{phoneVerificationToken\}`/);
  assert.match(storefront, /Вывести на кошелёк/);
  assert.doesNotMatch(storefront, /но хранятся отдельно/i);
  assert.match(globals, /\.profile-nft-balance-card/);
  assert.match(globals, /\.profile-nft-withdraw-form/);
});

test("NestJS and PostgreSQL project files are present", async () => {
  const [moduleSource, compose, orderSource] = await Promise.all([
    readFile(new URL("../server/src/app.module.ts", import.meta.url), "utf8"),
    readFile(new URL("../docker-compose.yml", import.meta.url), "utf8"),
    readFile(new URL("../server/src/orders/orders.service.ts", import.meta.url), "utf8"),
  ]);
  assert.match(moduleSource, /type:\s*"postgres"/);
  assert.match(compose, /postgres:16-alpine/);
  assert.match(orderSource, /orders\.save/);
});
