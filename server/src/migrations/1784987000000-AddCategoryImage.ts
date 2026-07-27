import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryImage1784987000000 implements MigrationInterface {
  name = "AddCategoryImage1784987000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "image" text NOT NULL DEFAULT ''`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "image"`);
  }
}
