import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductNaktaCoins1784995000000 implements MigrationInterface {
  name = "AddProductNaktaCoins1784995000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "naktaCoins" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "naktaCoins" integer NOT NULL DEFAULT 0`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "naktaCoins"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "naktaCoins"`);
  }
}
