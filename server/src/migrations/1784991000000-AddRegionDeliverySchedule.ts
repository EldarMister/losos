import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegionDeliverySchedule1784991000000 implements MigrationInterface {
  name = "AddRegionDeliverySchedule1784991000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "deliveryIs24Hours" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "deliveryWorkingDays" jsonb NOT NULL DEFAULT '[0,1,2,3,4,5,6]'::jsonb`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "deliveryWorkingDays"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "deliveryIs24Hours"`);
  }
}
