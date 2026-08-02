import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegionDeliveryDetails1784987000000 implements MigrationInterface {
  name = "AddRegionDeliveryDetails1784987000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "deliveryOpenTime" character varying NOT NULL DEFAULT '11:30'`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "deliveryCloseTime" character varying NOT NULL DEFAULT '22:30'`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "deliveryIs24Hours" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "deliveryWorkingDays" jsonb NOT NULL DEFAULT '[0,1,2,3,4,5,6]'::jsonb`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "freeDeliveryThreshold" integer NOT NULL DEFAULT 4900`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "deliveryFee" integer NOT NULL DEFAULT 99`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "estimatedDeliveryMinutes" integer NOT NULL DEFAULT 50`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "minimumOrderAmount" integer NOT NULL DEFAULT 900`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "maximumOrderAmount" integer NOT NULL DEFAULT 30000`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "maximumOrderAmount"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "minimumOrderAmount"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "estimatedDeliveryMinutes"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "deliveryFee"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "freeDeliveryThreshold"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "deliveryWorkingDays"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "deliveryIs24Hours"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "deliveryCloseTime"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "deliveryOpenTime"`);
  }
}
