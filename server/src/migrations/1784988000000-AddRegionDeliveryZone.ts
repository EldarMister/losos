import type { MigrationInterface, QueryRunner } from "typeorm";

const deliveryZones = {
  bishkek: [
    { latitude: 42.94, longitude: 74.48 },
    { latitude: 42.945, longitude: 74.62 },
    { latitude: 42.925, longitude: 74.71 },
    { latitude: 42.89, longitude: 74.75 },
    { latitude: 42.835, longitude: 74.74 },
    { latitude: 42.795, longitude: 74.68 },
    { latitude: 42.78, longitude: 74.57 },
    { latitude: 42.795, longitude: 74.48 },
    { latitude: 42.84, longitude: 74.43 },
    { latitude: 42.9, longitude: 74.44 },
  ],
  osh: [
    { latitude: 40.59, longitude: 72.75 },
    { latitude: 40.6, longitude: 72.84 },
    { latitude: 40.565, longitude: 72.9 },
    { latitude: 40.505, longitude: 72.91 },
    { latitude: 40.46, longitude: 72.86 },
    { latitude: 40.445, longitude: 72.78 },
    { latitude: 40.475, longitude: 72.72 },
    { latitude: 40.535, longitude: 72.7 },
  ],
} as const;

export class AddRegionDeliveryZone1784988000000 implements MigrationInterface {
  name = "AddRegionDeliveryZone1784988000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "deliveryZone" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
    for (const [slug, zone] of Object.entries(deliveryZones)) {
      await queryRunner.query(
        `UPDATE "regions" SET "deliveryZone" = $1::jsonb WHERE "slug" = $2 AND jsonb_array_length("deliveryZone") = 0`,
        [JSON.stringify(zone), slug],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "deliveryZone"`);
  }
}
