import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShortOrderNumbersAndAdminConfirmation1785002000000 implements MigrationInterface {
  name = "AddShortOrderNumbersAndAdminConfirmation1785002000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "orders_order_number_seq"`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "orderNumber" integer`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "orderNumber" SET DEFAULT nextval('"orders_order_number_seq"')`);
    await queryRunner.query(`UPDATE "orders" SET "orderNumber" = nextval('"orders_order_number_seq"') WHERE "orderNumber" IS NULL`);
    await queryRunner.query(`SELECT setval('"orders_order_number_seq"', COALESCE(MAX("orderNumber"), 0) + 1, false) FROM "orders"`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "orderNumber" SET NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_orders_order_number" ON "orders" ("orderNumber")`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "adminConfirmedAt" timestamp with time zone`);
    await queryRunner.query(`
      UPDATE "orders"
      SET "adminConfirmedAt" = COALESCE("updatedAt", "createdAt", NOW())
      WHERE "status" <> 'new' AND "adminConfirmedAt" IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "adminConfirmedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_order_number"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "orderNumber"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "orders_order_number_seq"`);
  }
}
