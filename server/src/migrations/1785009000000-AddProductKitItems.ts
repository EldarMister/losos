import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductKitItems1785009000000 implements MigrationInterface {
  name = "AddProductKitItems1785009000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "kitItems" jsonb NOT NULL DEFAULT '[]'::jsonb`);
    await queryRunner.query(`
      WITH eligible_dishes AS (
        SELECT DISTINCT category."regionId", LOWER(REGEXP_REPLACE(TRIM(product."name"), '[[:space:]]+', ' ', 'g')) AS normalized_name
        FROM "products" AS product
        JOIN "categories" AS category ON product."categoryId" = category."id"
        WHERE LOWER(category."title") NOT LIKE '%сет%'
          AND LOWER(product."name") NOT LIKE '%сет%'
          AND (
            LOWER(category."title") LIKE '%ролл%'
            OR (LOWER(category."title") LIKE '%суши%' AND LOWER(product."name") NOT LIKE '%сашими%')
          )
      )
      UPDATE "products" AS product
      SET "kitItems" = '[{"id":"soy-sauce","quantity":1},{"id":"pickled-ginger","quantity":1},{"id":"wasabi","quantity":1}]'::jsonb
      FROM "categories" AS category, eligible_dishes
      WHERE product."categoryId" = category."id"
        AND category."regionId" = eligible_dishes."regionId"
        AND LOWER(REGEXP_REPLACE(TRIM(product."name"), '[[:space:]]+', ' ', 'g')) = eligible_dishes.normalized_name
        AND LOWER(category."title") NOT LIKE '%сет%'
        AND product."kitItems" = '[]'::jsonb
    `);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "includedKitItems" jsonb NOT NULL DEFAULT '[]'::jsonb`);
    await queryRunner.query(`UPDATE "orders" SET "includedKitItems" = "kitItems" WHERE "includedKitItems" = '[]'::jsonb`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "includedKitItems"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "kitItems"`);
  }
}
