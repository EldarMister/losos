import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductionOrders1784980000000 implements MigrationInterface {
  name = "AddProductionOrders1784980000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "ctaUrl" text NOT NULL DEFAULT ''`);

    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "regionSlug" character varying(100) NOT NULL DEFAULT 'bishkek'`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deliveryType" character varying(20) NOT NULL DEFAULT 'delivery'`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "apartment" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "entrance" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "floor" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "intercom" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "comment" text NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utensilsCount" integer NOT NULL DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "noUtensils" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentMethod" character varying(30) NOT NULL DEFAULT 'cash'`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "idempotencyKey" character varying(120)`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "requestFingerprint" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "subtotal" integer`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);

    await queryRunner.query(`
      UPDATE "orders"
      SET
        "idempotencyKey" = COALESCE("idempotencyKey", 'legacy-' || "id"::text),
        "requestFingerprint" = COALESCE("requestFingerprint", md5("id"::text)),
        "subtotal" = COALESCE("subtotal", "total")
    `);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "idempotencyKey" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "requestFingerprint" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "subtotal" SET NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_orders_idempotency_key" ON "orders" ("idempotencyKey")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_region" ON "orders" ("regionSlug")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_status" ON "orders" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_created_at" ON "orders" ("createdAt" DESC)`);

    await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "basePrice" integer`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "modifiersPrice" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "lineTotal" integer`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "configurationKey" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "modifierSnapshots" jsonb NOT NULL DEFAULT '[]'::jsonb`);
    await queryRunner.query(`
      UPDATE "order_items"
      SET
        "basePrice" = COALESCE("basePrice", "unitPrice"),
        "lineTotal" = COALESCE("lineTotal", "unitPrice" * "quantity"),
        "configurationKey" = COALESCE("configurationKey", md5("productId"::text || ':legacy'))
    `);
    await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "basePrice" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "lineTotal" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "configurationKey" SET NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_region"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_idempotency_key"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "modifierSnapshots"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "configurationKey"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "lineTotal"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "modifiersPrice"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "basePrice"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "subtotal"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "requestFingerprint"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "idempotencyKey"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "paymentMethod"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "noUtensils"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "utensilsCount"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "comment"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "intercom"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "floor"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "entrance"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "apartment"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "deliveryType"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "regionSlug"`);
  }
}
