import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductOldPrice1784986000000 implements MigrationInterface {
  name = "AddProductOldPrice1784986000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "oldPrice" integer`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "oldPrice"`);
  }
}
