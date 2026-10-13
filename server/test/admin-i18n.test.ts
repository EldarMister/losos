import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import ts from "typescript";
import { adminLanguages, systemLanguage, translateAdmin } from "../../app/admin/i18n/store";
import { messages } from "../../app/admin/i18n/messages";

test("system languages resolve regional variants and use Russian for unsupported languages", () => {
  assert.equal(systemLanguage(["ky-KG", "ru-RU"]), "ky");
  assert.equal(systemLanguage(["uz-Cyrl-UZ"]), "uz");
  assert.equal(systemLanguage(["kk-KZ"]), "kk");
  assert.equal(systemLanguage(["en-US"]), "en");
  assert.equal(systemLanguage(["de-DE", "uz-Latn"]), "uz");
  assert.equal(systemLanguage(["de-DE"]), "ru");
});
test("all catalogues preserve interpolation arguments and have non-empty translations", () => {
  for (const [key, values] of Object.entries(messages)) {
    const placeholders = (key.match(/\{\d+\}/g) || []).sort();
    for (const lang of adminLanguages.filter(lang => lang !== "ru")) {
      assert.ok(values[lang].trim(), `${lang}: ${key}`);
      assert.deepEqual((values[lang].match(/\{\d+\}/g) || []).sort(), placeholders, `${lang}: ${key}`);
    }
  }
  assert.equal(translateAdmin("Заказ {0}", { 0: "№77" }, "en"), "Order №77");
  assert.equal(translateAdmin(" Его сеансы будут завершены.", {}, "en"), " Their sessions will be ended.");
  assert.equal(translateAdmin("Customer dish name", {}, "ky"), "Customer dish name");
});
test("every literal UI message has translations in all supported languages", () => {
  const root = resolve(__dirname, "../../app/admin");
  let count = 0;
  function scan(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== "i18n") scan(file); continue; }
      if (!/\.tsx?$/.test(file)) continue;
      const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
      function visit(node: ts.Node) {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "t" && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
          const key = node.arguments[0].text.trim();
          assert.ok(messages[key], `Missing message: ${key} in ${file}`); count++;
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
  scan(root); assert.ok(count > 900, `Expected full UI coverage, found ${count}`);
});
