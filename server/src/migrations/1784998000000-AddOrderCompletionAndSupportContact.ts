import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderCompletionAndSupportContact1784998000000 implements MigrationInterface {
  name = "AddOrderCompletionAndSupportContact1784998000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "supportPhone" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "supportUrl" text NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_completedAt" ON "orders" ("completedAt")`);
    await queryRunner.query(`UPDATE "orders" SET "completedAt" = "updatedAt" WHERE "status" = 'completed' AND "completedAt" IS NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_completedAt"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "completedAt"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "supportUrl"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "supportPhone"`);
  }
}
