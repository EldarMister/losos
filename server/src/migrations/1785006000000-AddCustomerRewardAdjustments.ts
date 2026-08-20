import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomerRewardAdjustments1785006000000 implements MigrationInterface {
  name = "AddCustomerRewardAdjustments1785006000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_reward_adjustments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "phone" varchar(20) NOT NULL,
        "regionSlug" varchar(100) NOT NULL,
        "asset" varchar(10) NOT NULL,
        "delta" integer NOT NULL,
        "balanceAfter" integer NOT NULL,
        "reason" varchar(240) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_customer_reward_asset" CHECK ("asset" IN ('coin', 'nft')),
        CONSTRAINT "CHK_customer_reward_delta" CHECK ("delta" <> 0),
        CONSTRAINT "CHK_customer_reward_balance" CHECK ("balanceAfter" >= 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customer_reward_adjustments_phone" ON "customer_reward_adjustments" ("phone")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customer_reward_adjustments_region" ON "customer_reward_adjustments" ("regionSlug")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_reward_adjustments"`);
  }
}
