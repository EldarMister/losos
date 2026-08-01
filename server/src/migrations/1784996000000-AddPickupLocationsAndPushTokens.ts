import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPickupLocationsAndPushTokens1784996000000
implements MigrationInterface {
  name = "AddPickupLocationsAndPushTokens1784996000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "pickup_locations" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL DEFAULT '',
        "address" character varying NOT NULL,
        "workingHours" character varying NOT NULL DEFAULT '',
        "latitude" double precision,
        "longitude" double precision,
        "yandexUrl" text NOT NULL DEFAULT '',
        "enabled" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "regionId" integer NOT NULL,
        CONSTRAINT "PK_pickup_locations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pickup_locations_region"
          FOREIGN KEY ("regionId") REFERENCES "regions"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pickup_locations_region_sort" ON "pickup_locations" ("regionId", "sortOrder", "id")`,
    );
    await queryRunner.query(`
      INSERT INTO "pickup_locations"
        ("title", "address", "workingHours", "yandexUrl", "enabled", "sortOrder", "regionId")
      SELECT "name", "pickupAddress", "pickupWorkingHours", "pickupYandexUrl", true, 0, "id"
      FROM "regions"
      WHERE NULLIF(TRIM("pickupAddress"), '') IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "device_push_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "deviceId" uuid NOT NULL,
        "expoPushToken" character varying(255) NOT NULL,
        "phone" character varying(20) NOT NULL,
        "platform" character varying(10) NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "lastSeenAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_device_push_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_device_push_tokens_device" UNIQUE ("deviceId"),
        CONSTRAINT "UQ_device_push_tokens_token" UNIQUE ("expoPushToken"),
        CONSTRAINT "FK_device_push_tokens_phone"
          FOREIGN KEY ("phone") REFERENCES "phone_accounts"("phone")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_device_push_tokens_phone" ON "device_push_tokens" ("phone")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "device_push_tokens"`);
    await queryRunner.query(`DROP TABLE "pickup_locations"`);
  }
}
