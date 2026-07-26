import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegionPickupAndFooter1784985000000 implements MigrationInterface {
  name = "AddRegionPickupAndFooter1784985000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "pickupAddress" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "pickupYandexUrl" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "pickupWorkingHours" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "footerCompanyName" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "footerLegalInfo" character varying NOT NULL DEFAULT ''`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "footerLegalInfo"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "footerCompanyName"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "pickupWorkingHours"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "pickupYandexUrl"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "pickupAddress"`);
  }
}
