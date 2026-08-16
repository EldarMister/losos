import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddNaktaCoinWithdrawals1785005000000 implements MigrationInterface {
  name = "AddNaktaCoinWithdrawals1785005000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "nakta_coin_withdrawals" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "phone" varchar(20) NOT NULL CONSTRAINT "FK_coin_withdrawals_phone" REFERENCES "phone_accounts"("phone") ON DELETE CASCADE,
        "regionSlug" varchar(100) NOT NULL,
        "amount" integer NOT NULL,
        "walletAddress" varchar(200) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "txHash" varchar(200),
        "error" text,
        "processedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_coin_withdrawals_amount" CHECK ("amount" > 0),
        CONSTRAINT "CHK_coin_withdrawals_status" CHECK ("status" IN ('pending', 'submitted', 'withdrawn', 'failed'))
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coin_withdrawals_phone" ON "nakta_coin_withdrawals" ("phone")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coin_withdrawals_region" ON "nakta_coin_withdrawals" ("regionSlug")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coin_withdrawals_status" ON "nakta_coin_withdrawals" ("status")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "nakta_coin_withdrawals"`);
  }
}
