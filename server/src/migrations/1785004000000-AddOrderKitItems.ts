import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderKitItems1785004000000 implements MigrationInterface {
  name = "AddOrderKitItems1785004000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "kitItems" jsonb NOT NULL DEFAULT '[]'::jsonb`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "kitItems"`);
  }
}
