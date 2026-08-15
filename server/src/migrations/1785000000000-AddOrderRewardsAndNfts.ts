import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderRewardsAndNfts1785000000000 implements MigrationInterface {
  name = "AddOrderRewardsAndNfts1785000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "naktaCoins" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "naktaCoinsReward" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nftRewardEveryOrders" integer NOT NULL DEFAULT 10`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nftRewardName" varchar(160) NOT NULL DEFAULT 'NFT NAKTA'`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nftRewardImage" text NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nftRewardDescription" text NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nftRewardNetwork" varchar(20) NOT NULL DEFAULT 'polygon'`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nftContractAddress" varchar(200) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nftMetadataUri" text NOT NULL DEFAULT ''`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "nakta_coin_transactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "phone" varchar(20) NOT NULL,
        "orderId" uuid NOT NULL UNIQUE,
        "amount" integer NOT NULL,
        "description" varchar(240) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coin_transactions_phone" ON "nakta_coin_transactions" ("phone")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "account_nfts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "phone" varchar(20) NOT NULL,
        "rewardKey" varchar(180) NOT NULL UNIQUE,
        "orderId" uuid NOT NULL,
        "milestoneOrderCount" integer NOT NULL,
        "name" varchar(160) NOT NULL,
        "image" text NOT NULL DEFAULT '',
        "description" text NOT NULL DEFAULT '',
        "network" varchar(20) NOT NULL,
        "contractAddress" varchar(200) NOT NULL DEFAULT '',
        "metadataUri" text NOT NULL DEFAULT '',
        "tokenId" varchar(160),
        "status" varchar(20) NOT NULL DEFAULT 'owned',
        "walletAddress" varchar(200),
        "txHash" varchar(200),
        "withdrawalError" text,
        "withdrawalRequestedAt" timestamptz,
        "withdrawnAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_account_nfts_phone" ON "account_nfts" ("phone")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_account_nfts_order" ON "account_nfts" ("orderId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_account_nfts_status" ON "account_nfts" ("status")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "account_nfts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "nakta_coin_transactions"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "naktaCoinsReward"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftMetadataUri"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftContractAddress"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardNetwork"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardDescription"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardImage"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardName"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardEveryOrders"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "naktaCoins"`);
  }
}
