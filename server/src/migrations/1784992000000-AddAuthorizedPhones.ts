import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthorizedPhones1784992000000 implements MigrationInterface {
  name = "AddAuthorizedPhones1784992000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "authorized_phones" (
        "phone" varchar(20) PRIMARY KEY,
        "enabled" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      INSERT INTO "authorized_phones" ("phone", "enabled")
      VALUES ('+996220203021', true)
      ON CONFLICT ("phone") DO UPDATE SET "enabled" = true
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "authorized_phones"`);
  }
}
