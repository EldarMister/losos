import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddNaktaCoins1784994000000 implements MigrationInterface {
  name = "AddNaktaCoins1784994000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "phone_accounts" ADD COLUMN IF NOT EXISTS "naktaCoins" integer NOT NULL DEFAULT 0`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "phone_accounts" DROP COLUMN IF EXISTS "naktaCoins"`);
  }
}
