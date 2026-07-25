import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductCustomization1784979000000 implements MigrationInterface {
  name = "AddProductCustomization1784979000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isNew" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "modifierGroups" jsonb NOT NULL DEFAULT '[]'::jsonb`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "badge"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "badge" character varying`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "modifierGroups"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "isNew"`);
  }
}
