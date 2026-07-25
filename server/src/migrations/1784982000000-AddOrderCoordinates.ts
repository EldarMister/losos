import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderCoordinates1784982000000 implements MigrationInterface {
  name = "AddOrderCoordinates1784982000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "latitude" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "longitude" double precision`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "longitude"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "latitude"`);
  }
}
