import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryImageVisibility1785013000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query('ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "imageHidden" boolean NOT NULL DEFAULT false');
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('ALTER TABLE "categories" DROP COLUMN "imageHidden"');
  }
}
