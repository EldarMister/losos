import assert from "node:assert/strict";
import test from "node:test";
import { contactPhoneHref, instagramHref, readSiteContacts, DEFAULT_SITE_CONTACTS } from "../../app/lib/site-settings";
import { DEFAULT_SITE_CONTACTS as apiDefaults } from "../dist/site-settings/site-settings.service";

test("website and API share the requested defaults and safe contact links", () => {
  assert.deepEqual(DEFAULT_SITE_CONTACTS, apiDefaults);
  assert.equal(contactPhoneHref("0505614614"), "tel:+996505614614");
  assert.equal(contactPhoneHref("+996 (505) 614-614"), "tel:+996505614614");
  assert.equal(contactPhoneHref("+7 777 123 45 67"), "tel:+77771234567");
  assert.equal(instagramHref("naktasushi_osh"), "https://www.instagram.com/naktasushi_osh/");
  assert.deepEqual(readSiteContacts(DEFAULT_SITE_CONTACTS), DEFAULT_SITE_CONTACTS);
  assert.equal(readSiteContacts({ ...DEFAULT_SITE_CONTACTS, instagram: "javascript:alert(1)" }), null);
  assert.equal(readSiteContacts({ ...DEFAULT_SITE_CONTACTS, phone: "tel:bad" }), null);
  assert.equal(readSiteContacts({ ...DEFAULT_SITE_CONTACTS, email: "invalid" }), null);
  assert.equal(readSiteContacts({ error: "API unavailable" }), null);
});
