import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddMultiDeviceAccountSessions1785002000000 implements MigrationInterface {
  name = "AddMultiDeviceAccountSessions1785002000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "account_sessions" (
        "id" uuid PRIMARY KEY,
        "phone" varchar(20) NOT NULL,
        "tokenHash" varchar(64) NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_account_sessions_token" ON "account_sessions" ("tokenHash")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_account_sessions_phone_expiry" ON "account_sessions" ("phone", "expiresAt")`);
    await queryRunner.query(`
      INSERT INTO "account_sessions" ("id", "phone", "tokenHash", "expiresAt")
      SELECT (
        substr(md5("phone" || ':' || "sessionTokenHash"), 1, 8) || '-' ||
        substr(md5("phone" || ':' || "sessionTokenHash"), 9, 4) || '-' ||
        substr(md5("phone" || ':' || "sessionTokenHash"), 13, 4) || '-' ||
        substr(md5("phone" || ':' || "sessionTokenHash"), 17, 4) || '-' ||
        substr(md5("phone" || ':' || "sessionTokenHash"), 21, 12)
      )::uuid, "phone", "sessionTokenHash", "sessionExpiresAt"
      FROM "phone_accounts"
      WHERE "sessionTokenHash" IS NOT NULL AND "sessionExpiresAt" IS NOT NULL
      ON CONFLICT ("tokenHash") DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "account_sessions"`);
  }
}
