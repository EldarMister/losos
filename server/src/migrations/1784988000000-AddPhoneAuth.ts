import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneAuth1784988000000 implements MigrationInterface {
  name = "AddPhoneAuth1784988000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "phone_auth_challenges" (
        "id" uuid PRIMARY KEY,
        "phone" varchar(20) NOT NULL,
        "providerToken" varchar(255) NOT NULL,
        "attemptCount" integer NOT NULL DEFAULT 0,
        "expiresAt" timestamptz NOT NULL,
        "nextSendAt" timestamptz NOT NULL,
        "verifiedAt" timestamptz,
        "verificationTokenHash" varchar(64),
        "verificationTokenExpiresAt" timestamptz,
        "consumedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_phone_auth_phone" ON "phone_auth_challenges" ("phone")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_phone_auth_token" ON "phone_auth_challenges" ("verificationTokenHash")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_phone_auth_phone_created" ON "phone_auth_challenges" ("phone", "createdAt")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "phone_auth_challenges"`);
  }
}
