import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddScopedModifierPricing1784983000000 implements MigrationInterface {
  name = "AddScopedModifierPricing1784983000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "baseTotal" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "modifiersTotal" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "pricingVersion" character varying(30)`,
    );
    await queryRunner.query(`
      UPDATE "order_items"
      SET
        "baseTotal" = COALESCE("baseTotal", "basePrice" * "quantity"),
        "modifiersTotal" = COALESCE("modifiersTotal", "modifiersPrice" * "quantity"),
        "pricingVersion" = COALESCE("pricingVersion", 'legacy-per-product')
    `);
    await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "baseTotal" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "modifiersTotal" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "modifiersTotal" SET DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "pricingVersion" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "order_items" ALTER COLUMN "pricingVersion" SET DEFAULT 'scoped-v2'`,
    );
    await queryRunner.query(`
      UPDATE "order_items"
      SET "modifierSnapshots" = COALESCE((
        SELECT jsonb_agg(
          CASE
            WHEN snapshot.value ? 'priceScope' THEN snapshot.value
            ELSE snapshot.value || '{"priceScope":"per-product"}'::jsonb
          END
          ORDER BY snapshot.ordinality
        )
        FROM jsonb_array_elements(
          CASE
            WHEN jsonb_typeof("order_items"."modifierSnapshots") = 'array'
              THEN "order_items"."modifierSnapshots"
            ELSE '[]'::jsonb
          END
        ) WITH ORDINALITY AS snapshot(value, ordinality)
      ), '[]'::jsonb)
    `);

    await queryRunner.query(`
      UPDATE "products" AS product
      SET "modifierGroups" = normalized.groups
      FROM (
        SELECT
          source."id",
          COALESCE(
            jsonb_agg(
              jsonb_set(
                jsonb_set(
                  modifier_group.value,
                  '{priceScope}',
                  COALESCE(modifier_group.value -> 'priceScope', '"per-product"'::jsonb),
                  true
                ),
                '{items}',
                COALESCE((
                  SELECT jsonb_agg(
                    jsonb_set(
                      modifier_item.value,
                      '{maxQuantity}',
                      COALESCE(
                        modifier_item.value -> 'maxQuantity',
                        to_jsonb(
                          CASE
                            WHEN modifier_group.value ->> 'selectionType' = 'single' THEN 1
                            ELSE 20
                          END
                        )
                      ),
                      true
                    )
                    ORDER BY modifier_item.ordinality
                  )
                  FROM jsonb_array_elements(
                    CASE
                      WHEN jsonb_typeof(modifier_group.value -> 'items') = 'array'
                        THEN modifier_group.value -> 'items'
                      ELSE '[]'::jsonb
                    END
                  ) WITH ORDINALITY AS modifier_item(value, ordinality)
                ), '[]'::jsonb),
                true
              )
              ORDER BY modifier_group.ordinality
            ),
            '[]'::jsonb
          ) AS groups
        FROM "products" AS source
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE
            WHEN jsonb_typeof(source."modifierGroups") = 'array'
              THEN source."modifierGroups"
            ELSE '[]'::jsonb
          END
        ) WITH ORDINALITY AS modifier_group(value, ordinality)
        GROUP BY source."id"
      ) AS normalized
      WHERE product."id" = normalized."id"
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "pricingVersion"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "modifiersTotal"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "baseTotal"`);
  }
}
