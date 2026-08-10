import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCaptchaProtectedPhoneAuth1784999000000 implements MigrationInterface {
  name = "AddCaptchaProtectedPhoneAuth1784999000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "phone_auth_challenges" (
        "id" uuid PRIMARY KEY,
        "phone" varchar(20) NOT NULL,
        "channel" varchar(16) NOT NULL DEFAULT 'sms',
        "providerToken" varchar(255) NOT NULL,
        "requestIpHash" varchar(64),
        "attemptCount" integer NOT NULL DEFAULT 0,
        "expiresAt" timestamptz NOT NULL,
        "nextSendAt" timestamptz NOT NULL,
        "verifiedAt" timestamptz,
        "consumedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`ALTER TABLE "phone_auth_challenges" ADD COLUMN IF NOT EXISTS "requestIpHash" varchar(64)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_phone_auth_phone_created" ON "phone_auth_challenges" ("phone", "createdAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_phone_auth_ip" ON "phone_auth_challenges" ("requestIpHash")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "authorized_phones" (
        "phone" varchar(20) PRIMARY KEY,
        "enabled" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "phone_accounts" (
        "phone" varchar(20) PRIMARY KEY,
        "sessionTokenHash" varchar(64),
        "sessionExpiresAt" timestamptz,
        "naktaCoins" integer NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_phone_accounts_session" ON "phone_accounts" ("sessionTokenHash")`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "device_push_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "deviceId" uuid NOT NULL UNIQUE,
        "expoPushToken" varchar(255) NOT NULL UNIQUE,
        "phone" varchar(20) NOT NULL,
        "platform" varchar(10) NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "lastSeenAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_device_push_phone" ON "device_push_tokens" ("phone")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "device_push_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "phone_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "authorized_phones"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "phone_auth_challenges"`);
  }
}
