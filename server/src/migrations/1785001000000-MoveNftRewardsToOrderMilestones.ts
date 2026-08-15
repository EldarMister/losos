import type { MigrationInterface, QueryRunner } from "typeorm";

export class MoveNftRewardsToOrderMilestones1785001000000 implements MigrationInterface {
  name = "MoveNftRewardsToOrderMilestones1785001000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nftRewardEveryOrders" integer NOT NULL DEFAULT 10`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nftRewardName" varchar(160) NOT NULL DEFAULT 'NFT NAKTA'`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nftRewardImage" text NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nftRewardDescription" text NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nftRewardNetwork" varchar(20) NOT NULL DEFAULT 'polygon'`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nftContractAddress" varchar(200) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nftMetadataUri" text NOT NULL DEFAULT ''`);

    await queryRunner.query(`ALTER TABLE "account_nfts" ADD COLUMN IF NOT EXISTS "milestoneOrderCount" integer`);
    await queryRunner.query(`UPDATE "account_nfts" SET "milestoneOrderCount" = 0 WHERE "milestoneOrderCount" IS NULL`);
    await queryRunner.query(`ALTER TABLE "account_nfts" ALTER COLUMN "milestoneOrderCount" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "account_nfts" DROP COLUMN IF EXISTS "orderItemId"`);

    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "nftRewardSnapshot"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "nftMetadataUri"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "nftContractAddress"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "nftRewardNetwork"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "nftRewardDescription"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "nftRewardImage"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "nftRewardName"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account_nfts" ADD COLUMN IF NOT EXISTS "orderItemId" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "account_nfts" DROP COLUMN IF EXISTS "milestoneOrderCount"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftMetadataUri"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftContractAddress"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardNetwork"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardDescription"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardImage"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardName"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardEveryOrders"`);
  }
}
