import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegionDeliverySettings1784990000000 implements MigrationInterface {
  name = "AddRegionDeliverySettings1784990000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "deliveryOpenTime" character varying(5) NOT NULL DEFAULT '11:30'`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "deliveryCloseTime" character varying(5) NOT NULL DEFAULT '22:30'`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "freeDeliveryThreshold" integer NOT NULL DEFAULT 4900`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "freeDeliveryThreshold"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "deliveryCloseTime"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "deliveryOpenTime"`);
  }
}
