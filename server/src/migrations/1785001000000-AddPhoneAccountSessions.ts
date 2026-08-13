import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneAccountSessions1785001000000 implements MigrationInterface {
  name = "AddPhoneAccountSessions1785001000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "phone_account_sessions" (
        "tokenHash" varchar(64) PRIMARY KEY,
        "phone" varchar(20) NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_phone_account_sessions_phone"
          FOREIGN KEY ("phone") REFERENCES "phone_accounts"("phone") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_phone_account_sessions_phone_expires"
      ON "phone_account_sessions" ("phone", "expiresAt")
    `);
    await queryRunner.query(`
      INSERT INTO "phone_account_sessions" ("tokenHash", "phone", "expiresAt")
      SELECT "sessionTokenHash", "phone", "sessionExpiresAt"
      FROM "phone_accounts"
      WHERE "sessionTokenHash" IS NOT NULL AND "sessionExpiresAt" IS NOT NULL
      ON CONFLICT ("tokenHash") DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "phone_account_sessions"`);
  }
}
