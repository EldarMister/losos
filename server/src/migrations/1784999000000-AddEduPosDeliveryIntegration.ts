import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEduPosDeliveryIntegration1784999000000 implements MigrationInterface {
  name = "AddEduPosDeliveryIntegration1784999000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
        ADD COLUMN "posDishId" varchar(160),
        ADD COLUMN "posVariantId" varchar(160),
        ADD COLUMN "posAvailable" boolean NOT NULL DEFAULT true,
        ADD COLUMN "posSoldByWeight" boolean NOT NULL DEFAULT false,
        ADD COLUMN "posLastSyncedAt" timestamptz
    `);
    await queryRunner.query(`CREATE INDEX "IDX_products_posDishId" ON "products" ("posDishId")`);

    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD COLUMN "externalOrderId" varchar(160),
        ADD COLUMN "posOrderId" varchar(160),
        ADD COLUMN "posOrderNumber" varchar(80),
        ADD COLUMN "posStatus" varchar(40),
        ADD COLUMN "posSyncStatus" varchar(30) NOT NULL DEFAULT 'pending',
        ADD COLUMN "posItemsTotal" integer NOT NULL DEFAULT 0,
        ADD COLUMN "posItemsReady" integer NOT NULL DEFAULT 0,
        ADD COLUMN "posItemsRejected" integer NOT NULL DEFAULT 0,
        ADD COLUMN "posCreatedAt" timestamptz,
        ADD COLUMN "posUpdatedAt" timestamptz,
        ADD COLUMN "posLastSyncAt" timestamptz,
        ADD COLUMN "posRetryCount" integer NOT NULL DEFAULT 0,
        ADD COLUMN "posNextRetryAt" timestamptz,
        ADD COLUMN "posLastError" text NOT NULL DEFAULT ''
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_orders_externalOrderId" ON "orders" ("externalOrderId") WHERE "externalOrderId" IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_posOrderId" ON "orders" ("posOrderId")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_posStatus" ON "orders" ("posStatus")`);

    await queryRunner.query(`
      ALTER TABLE "order_items"
        ADD COLUMN "posDishId" varchar(160),
        ADD COLUMN "posVariantId" varchar(160),
        ADD COLUMN "posWeightGrams" integer,
        ADD COLUMN "posStatus" varchar(30),
        ADD COLUMN "posReadyQuantity" integer NOT NULL DEFAULT 0,
        ADD COLUMN "posRejectReason" text
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "posRejectReason", DROP COLUMN "posReadyQuantity", DROP COLUMN "posStatus", DROP COLUMN "posWeightGrams", DROP COLUMN "posVariantId", DROP COLUMN "posDishId"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_posStatus"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_posOrderId"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_externalOrderId"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "posLastError", DROP COLUMN "posNextRetryAt", DROP COLUMN "posRetryCount", DROP COLUMN "posLastSyncAt", DROP COLUMN "posUpdatedAt", DROP COLUMN "posCreatedAt", DROP COLUMN "posItemsRejected", DROP COLUMN "posItemsReady", DROP COLUMN "posItemsTotal", DROP COLUMN "posSyncStatus", DROP COLUMN "posStatus", DROP COLUMN "posOrderNumber", DROP COLUMN "posOrderId", DROP COLUMN "externalOrderId"`);
    await queryRunner.query(`DROP INDEX "IDX_products_posDishId"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "posLastSyncedAt", DROP COLUMN "posSoldByWeight", DROP COLUMN "posAvailable", DROP COLUMN "posVariantId", DROP COLUMN "posDishId"`);
  }
}
