import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCartConfiguration1785008000000 implements MigrationInterface {
  name = "AddCartConfiguration1785008000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "freeKitItems" jsonb`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "toppingProductIds" jsonb`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "toppingProductIds"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "freeKitItems"`);
  }
}
