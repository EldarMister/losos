const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { Client } = require("pg");
const { DataSource } = require("typeorm");
const { ConfigService } = require("@nestjs/config");
const { PhoneAuthService } = require("../dist/auth/phone-auth.service");
const { NikitaOtpService } = require("../dist/auth/nikita-otp.service");
const { PhoneAuthChallenge } = require("../dist/auth/phone-auth.entity");
const { AuthorizedPhone } = require("../dist/auth/authorized-phone.entity");
const { PhoneAccount } = require("../dist/auth/phone-account.entity");
const { PhoneAccountSession } = require("../dist/auth/phone-account-session.entity");

async function main() {
  const url = process.env.SMS_TEST_DATABASE_URL;
  if (!url || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)) {
    throw new Error("SMS_TEST_DATABASE_URL must point to a local PostgreSQL instance");
  }
  const schema = `sms_test_${randomUUID().replaceAll("-", "")}`;
  const client = new Client({ connectionString: url });
  await client.connect();
  const dataSource = new DataSource({
    type: "postgres", url, schema, synchronize: true,
    entities: [PhoneAuthChallenge, AuthorizedPhone, PhoneAccount, PhoneAccountSession],
  });
  const originalFetch = globalThis.fetch;
  const codes = new Map();
  let sendCount = 0;
  let schemaCreated = false;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    schemaCreated = true;
    await dataSource.initialize();
    globalThis.fetch = async (url, init) => {
      assert.equal(url, "https://smspro.nikita.kg/api/message");
      const xml = String(init.body);
      assert.match(xml, /<sender>NktaSushiKG<\/sender>/);
      const id = /<id>([^<]+)<\/id>/.exec(xml)[1];
      const phone = /<phone>([^<]+)<\/phone>/.exec(xml)[1];
      codes.set(`+${phone}`, /код (\d{6})/.exec(xml)[1]);
      sendCount += 1;
      return new Response(`<response><id>${id}</id><status>0</status><phones>1</phones><smscnt>1</smscnt></response>`);
    };
    const config = new ConfigService({
      NIKITA_SMS_LOGIN: "test-account", NIKITA_SMS_PASSWORD: "test-password",
      OTP_HASH_SECRET: "private-test-secret-with-at-least-32-characters",
    });
    const challengeRepository = dataSource.getRepository(PhoneAuthChallenge);
    const auth = new PhoneAuthService(
      challengeRepository, config, new NikitaOtpService(config), {},
      { verify: async () => undefined }, dataSource.getRepository(AuthorizedPhone),
      dataSource.getRepository(PhoneAccount), dataSource.getRepository(PhoneAccountSession),
    );
    const first = "+996555123456";
    assert.deepEqual(await auth.requestCode(first, "test-captcha", "127.0.0.1"), {
      expiresInSeconds: 300, retryAfterSeconds: 60,
    });
    await assert.rejects(auth.requestCode(first, "test-captcha", "127.0.0.1"), (error) => error.getStatus() === 429);
    assert.equal(sendCount, 1);
    const firstResults = await Promise.allSettled([
      auth.verifyCode(first, codes.get(first)), auth.verifyCode(first, codes.get(first)),
    ]);
    assert.equal(firstResults.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(firstResults.filter((result) => result.status === "rejected").length, 1);
    assert.equal(await dataSource.getRepository(PhoneAccountSession).countBy({ phone: first }), 1);
    await assert.rejects(auth.verifyCode(first, codes.get(first)), (error) => error.getStatus() === 401);

    const second = "+996555123457";
    await auth.requestCode(second, "test-captcha", "127.0.0.1");
    const wrong = String((Number(codes.get(second)) + 1) % 1_000_000).padStart(6, "0");
    const attempts = await Promise.allSettled(Array.from({ length: 5 }, () => auth.verifyCode(second, wrong)));
    assert.ok(attempts.every((result) => result.status === "rejected"));
    assert.equal((await challengeRepository.findOneByOrFail({ phone: second })).attemptCount, 5);
    await assert.rejects(auth.verifyCode(second, codes.get(second)), (error) => error.getStatus() === 401);
    assert.equal(await dataSource.getRepository(PhoneAccountSession).countBy({ phone: second }), 0);

    const third = "+996555123458";
    await auth.requestCode(third, "test-captcha", "127.0.0.1");
    await challengeRepository.update({ phone: third }, { expiresAt: new Date(Date.now() - 1_000) });
    await assert.rejects(auth.verifyCode(third, codes.get(third)), (error) => error.getStatus() === 401);
    console.log("PASS: PostgreSQL SMS flow: resend limit, one-time concurrent verification, committed attempt limits, expiry. All SMS requests mocked.");
  } finally {
    globalThis.fetch = originalFetch;
    if (dataSource.isInitialized) await dataSource.destroy();
    if (schemaCreated) await client.query(`DROP SCHEMA "${schema}" CASCADE`);
    await client.end();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
