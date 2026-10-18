import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { messages } from "../../app/lib/site-i18n/messages";
import { resolveSiteLanguage, siteLanguages, translateSite } from "../../app/lib/site-i18n/store";

test("website uses the mobile language order and system-language fallback", () => {
  assert.deepEqual(siteLanguages.map(item => item.code), ["ru", "ky", "en", "uz", "kk"]);
  assert.equal(resolveSiteLanguage(["ky-KG", "en-US"]), "ky");
  assert.equal(resolveSiteLanguage(["uz-Cyrl-UZ"]), "uz");
  assert.equal(resolveSiteLanguage(["kk-KZ"]), "kk");
  assert.equal(resolveSiteLanguage(["de-DE", "ru-RU"]), "ru");
  assert.equal(resolveSiteLanguage(["de-DE"]), "en");
});
test("all website translations preserve their arguments", () => {
  for (const [key, value] of Object.entries(messages)) {
    const placeholders = (key.match(/\{\d+\}/g) || []).sort();
    for (const { code } of siteLanguages) {
      assert.ok(value[code].trim(), `${code}: ${key}`);
      assert.deepEqual((value[code].match(/\{\d+\}/g) || []).sort(), placeholders, `${code}: ${key}`);
    }
  }
  assert.equal(translateSite("Доставка", {}, "en"), "Delivery");
  assert.equal(translateSite("Доставка", {}, "ky"), "Жеткирүү");
  assert.equal(translateSite("   Доставка   ", {}, "en"), "   Delivery   ");
  assert.equal(translateSite("Выберите адрес в городе {0}", { 0: "Ош" }, "en"), "Choose an address in Ош");
  assert.equal(translateSite("My custom dish {0}", {}, "ky"), "My custom dish {0}");
});
test("all storefront UI messages have translations, and assets and matching rules stay unmodified", () => {
  let count = 0;
  for (const file of ["Storefront.tsx", "YandexDeliveryMap.tsx", "TurnstileWidget.tsx", "SiteLanguageSelector.tsx"]) {
    const path = resolve(__dirname, "../../app/components", file);
    const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "t" && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        const key = node.arguments[0].text.trim().replace(/[ \t]+/g, " ");
        assert.ok(messages[key], `Missing message ${key} in ${file}`);
        assert.ok(!key.startsWith("/") && !key.startsWith("(?:"), `Technical value translated: ${key}`);
        count++;
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.ok(count > 300);
  const storefront = readFileSync(resolve(__dirname, "../../app/components/Storefront.tsx"), "utf8");
  assert.ok(storefront.includes('selected?.name === "Картофель фри"'));
});
