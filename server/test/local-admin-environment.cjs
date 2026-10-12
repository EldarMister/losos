// Test harness only. Never imported by production application code.
module.exports = function localAdminEnvironment() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL must be explicit");
  const parsed = new URL(url);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) || !/test/i.test(parsed.pathname)) throw new Error("Local admin testing requires a local database with test in its name");
  process.env.DATABASE_URL = url;
  process.env.NODE_ENV = "development";
  process.env.DB_SYNCHRONIZE = "false";
  process.env.SEED_CATALOG_ON_STARTUP = "false";
  process.env.PORT = "4100";
  process.env.FRONTEND_ORIGIN = "http://localhost:3100,http://127.0.0.1:3100,http://localhost:3102,http://127.0.0.1:3102";
  process.env.ADMIN_BOOTSTRAP_ENABLED = "true";
  process.env.ADMIN_TOKEN = "local-admin-test-bootstrap-2026-only";
  process.env.OTP_HASH_SECRET = "local-admin-test-phone-secret-2026-only";
  for (const key of ["EDU_POS_URL", "EDU_POS_API_KEY", "NIKITA_OTP_API_KEY", "WHATSAPP_BOT_PHONE", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_APP_SECRET", "WHATSAPP_WEBHOOK_VERIFY_TOKEN", "TURNSTILE_SECRET_KEY", "ADMIN_VAPID_PUBLIC_KEY", "ADMIN_VAPID_PRIVATE_KEY", "ADMIN_VAPID_SUBJECT"]) process.env[key] = "";
  delete process.env.VERCEL;
  const originalFetch = global.fetch;
  global.fetch = (input, init) => {
    const target = new URL(typeof input === "string" || input instanceof URL ? String(input) : input.url);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) return Promise.reject(new Error("Outbound networking is disabled in the local admin test harness"));
    return originalFetch(input, init);
  };
};
