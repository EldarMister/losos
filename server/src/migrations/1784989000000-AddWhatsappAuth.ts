import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddWhatsappAuth1784989000000 implements MigrationInterface {
  name = "AddWhatsappAuth1784989000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "phone_auth_challenges"
      ADD COLUMN IF NOT EXISTS "channel" varchar(16) NOT NULL DEFAULT 'sms'
    `);
    await queryRunner.query(`
      ALTER TABLE "phone_auth_challenges"
      ADD COLUMN IF NOT EXISTS "pollTokenHash" varchar(64)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_phone_auth_channel"
      ON "phone_auth_challenges" ("channel")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_phone_auth_poll_token"
      ON "phone_auth_challenges" ("pollTokenHash")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_phone_auth_channel_provider"
      ON "phone_auth_challenges" ("channel", "providerToken")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_phone_auth_channel_provider"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_phone_auth_poll_token"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_phone_auth_channel"`);
    await queryRunner.query(`ALTER TABLE "phone_auth_challenges" DROP COLUMN IF EXISTS "pollTokenHash"`);
    await queryRunner.query(`ALTER TABLE "phone_auth_challenges" DROP COLUMN IF EXISTS "channel"`);
  }
}
