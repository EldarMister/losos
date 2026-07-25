import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Creates the schema that used to be produced only by TypeORM synchronize.
 *
 * Every statement is additive so this migration is also safe to register on
 * databases that were already bootstrapped by synchronize before migrations
 * became authoritative.
 */
export class BootstrapSchema1784978000000 implements MigrationInterface {
  name = "BootstrapSchema1784978000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "regions" (
        "id" SERIAL NOT NULL,
        "slug" character varying NOT NULL,
        "name" character varying NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_regions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_regions_slug" ON "regions" ("slug")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" SERIAL NOT NULL,
        "slug" character varying NOT NULL,
        "title" character varying NOT NULL,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "regionId" integer NOT NULL,
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "FK_categories_region" FOREIGN KEY ("regionId")
          REFERENCES "regions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_categories_region_slug"
      ON "categories" ("regionId", "slug")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" SERIAL NOT NULL,
        "sourceId" integer,
        "slug" character varying NOT NULL,
        "name" character varying NOT NULL,
        "price" integer NOT NULL,
        "image" text NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "composition" text NOT NULL DEFAULT '',
        "weight" integer NOT NULL DEFAULT 0,
        "calories" integer NOT NULL DEFAULT 0,
        "protein" integer NOT NULL DEFAULT 0,
        "fat" integer NOT NULL DEFAULT 0,
        "carbs" integer NOT NULL DEFAULT 0,
        "available" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "categoryId" integer NOT NULL,
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "FK_products_category" FOREIGN KEY ("categoryId")
          REFERENCES "categories"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_slug" ON "products" ("slug")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_category" ON "products" ("categoryId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "promotions" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "image" text NOT NULL,
        "cta" character varying NOT NULL DEFAULT '',
        "ctaUrl" text NOT NULL DEFAULT '',
        "enabled" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "regionId" integer NOT NULL,
        CONSTRAINT "PK_promotions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_promotions_region" FOREIGN KEY ("regionId")
          REFERENCES "regions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_promotions_region" ON "promotions" ("regionId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customerName" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "address" character varying NOT NULL,
        "total" integer NOT NULL,
        "status" character varying NOT NULL DEFAULT 'new',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_items" (
        "id" SERIAL NOT NULL,
        "productId" integer NOT NULL,
        "productName" character varying NOT NULL,
        "unitPrice" integer NOT NULL,
        "quantity" integer NOT NULL,
        "orderId" uuid NOT NULL,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("orderId")
          REFERENCES "orders"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_order_items_order" ON "order_items" ("orderId")`);
  }

  async down(): Promise<void> {
    // Intentionally non-destructive: this migration can be applied to legacy
    // databases whose tables predate TypeORM's migration history.
  }
}
