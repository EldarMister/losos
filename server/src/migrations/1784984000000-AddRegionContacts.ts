import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegionContacts1784984000000 implements MigrationInterface {
  name = "AddRegionContacts1784984000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "contactPhone" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "contactEmail" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "contactAddress" character varying NOT NULL DEFAULT ''`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "contactAddress"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "contactEmail"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "contactPhone"`);
  }
}
