import type { MigrationInterface, QueryRunner } from "typeorm";

const otuzAdyrDeliveryZone = [
  { latitude: 40.64, longitude: 72.92 },
  { latitude: 40.645, longitude: 72.98 },
  { latitude: 40.625, longitude: 73.02 },
  { latitude: 40.59, longitude: 73.02 },
  { latitude: 40.565, longitude: 72.99 },
  { latitude: 40.565, longitude: 72.94 },
  { latitude: 40.585, longitude: 72.91 },
  { latitude: 40.62, longitude: 72.91 },
] as const;

export class AddSharedRegionContentAndOtuzAdyr1785000000000 implements MigrationInterface {
  name = "AddSharedRegionContentAndOtuzAdyr1785000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "menuSourceRegionSlug" varchar(100)`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "promotionSourceRegionSlug" varchar(100)`);
    await queryRunner.query(
      `
        INSERT INTO "regions" (
          "slug", "name", "enabled", "sortOrder", "deliveryZone",
          "menuSourceRegionSlug", "promotionSourceRegionSlug"
        )
        VALUES ('otuz-adyr', 'Отуз-Адыр', true, 2, $1::jsonb, 'osh', 'osh')
        ON CONFLICT ("slug") DO UPDATE SET
          "deliveryZone" = CASE
            WHEN jsonb_array_length("regions"."deliveryZone") = 0 THEN EXCLUDED."deliveryZone"
            ELSE "regions"."deliveryZone"
          END,
          "menuSourceRegionSlug" = COALESCE("regions"."menuSourceRegionSlug", 'osh'),
          "promotionSourceRegionSlug" = COALESCE("regions"."promotionSourceRegionSlug", 'osh')
      `,
      [JSON.stringify(otuzAdyrDeliveryZone)],
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "promotionSourceRegionSlug"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "menuSourceRegionSlug"`);
  }
}
