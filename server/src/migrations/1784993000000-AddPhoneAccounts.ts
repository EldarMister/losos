import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneAccounts1784993000000 implements MigrationInterface {
  name = "AddPhoneAccounts1784993000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "phone_accounts" (
        "phone" varchar(20) PRIMARY KEY,
        "sessionTokenHash" varchar(64),
        "sessionExpiresAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_phone_accounts_session" ON "phone_accounts" ("sessionTokenHash")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "phone_accounts"`);
  }
}
