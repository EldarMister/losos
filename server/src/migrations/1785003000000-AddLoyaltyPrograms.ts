import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddLoyaltyPrograms1785003000000 implements MigrationInterface {
  name = "AddLoyaltyPrograms1785003000000";

  async up(queryRunner: QueryRunner): Promise<void> {
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
        "phone" varchar(20) NOT NULL CONSTRAINT "FK_coin_transactions_phone" REFERENCES "phone_accounts"("phone") ON DELETE CASCADE,
        "regionSlug" varchar(100) NOT NULL,
        "orderId" uuid NOT NULL UNIQUE CONSTRAINT "FK_coin_transactions_order" REFERENCES "orders"("id") ON DELETE CASCADE,
        "amount" integer NOT NULL CHECK ("amount" >= 0),
        "description" varchar(240) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    // The NFT feature previously lived on a separate branch. These statements
    // upgrade that branch's already-created tables as well as creating a fresh schema.
    await queryRunner.query(`ALTER TABLE "nakta_coin_transactions" ADD COLUMN IF NOT EXISTS "regionSlug" varchar(100)`);
    await queryRunner.query(`
      UPDATE "nakta_coin_transactions" reward
      SET "regionSlug" = orders."regionSlug"
      FROM "orders" orders
      WHERE orders."id" = reward."orderId" AND reward."regionSlug" IS NULL
    `);
    await queryRunner.query(`ALTER TABLE "nakta_coin_transactions" ALTER COLUMN "regionSlug" SET NOT NULL`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_coin_transactions_phone'
            AND conrelid = 'nakta_coin_transactions'::regclass
        ) THEN
          ALTER TABLE "nakta_coin_transactions"
            ADD CONSTRAINT "FK_coin_transactions_phone"
            FOREIGN KEY ("phone") REFERENCES "phone_accounts"("phone") ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_coin_transactions_order'
            AND conrelid = 'nakta_coin_transactions'::regclass
        ) THEN
          ALTER TABLE "nakta_coin_transactions"
            ADD CONSTRAINT "FK_coin_transactions_order"
            FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE;
        END IF;
      END $$
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coin_transactions_phone" ON "nakta_coin_transactions" ("phone")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coin_transactions_region" ON "nakta_coin_transactions" ("regionSlug")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "account_nfts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "phone" varchar(20) NOT NULL CONSTRAINT "FK_account_nfts_phone" REFERENCES "phone_accounts"("phone") ON DELETE CASCADE,
        "regionSlug" varchar(100) NOT NULL,
        "rewardKey" varchar(180) NOT NULL UNIQUE,
        "orderId" uuid NOT NULL CONSTRAINT "FK_account_nfts_order" REFERENCES "orders"("id") ON DELETE CASCADE,
        "milestoneOrderCount" integer NOT NULL CHECK ("milestoneOrderCount" > 0),
        "name" varchar(160) NOT NULL,
        "image" text NOT NULL DEFAULT '',
        "description" text NOT NULL DEFAULT '',
        "network" varchar(20) NOT NULL CHECK ("network" IN ('polygon', 'ethereum', 'bsc', 'solana', 'ton')),
        "contractAddress" varchar(200) NOT NULL DEFAULT '',
        "metadataUri" text NOT NULL DEFAULT '',
        "tokenId" varchar(160),
        "status" varchar(20) NOT NULL DEFAULT 'owned' CHECK ("status" IN ('owned', 'pending', 'submitted', 'withdrawn', 'failed')),
        "walletAddress" varchar(200),
        "txHash" varchar(200),
        "withdrawalError" text,
        "withdrawalRequestedAt" timestamptz,
        "withdrawnAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`ALTER TABLE "account_nfts" ADD COLUMN IF NOT EXISTS "regionSlug" varchar(100)`);
    await queryRunner.query(`
      UPDATE "account_nfts" reward
      SET "regionSlug" = orders."regionSlug"
      FROM "orders" orders
      WHERE orders."id" = reward."orderId" AND reward."regionSlug" IS NULL
    `);
    await queryRunner.query(`ALTER TABLE "account_nfts" ALTER COLUMN "regionSlug" SET NOT NULL`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_account_nfts_phone'
            AND conrelid = 'account_nfts'::regclass
        ) THEN
          ALTER TABLE "account_nfts"
            ADD CONSTRAINT "FK_account_nfts_phone"
            FOREIGN KEY ("phone") REFERENCES "phone_accounts"("phone") ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_account_nfts_order'
            AND conrelid = 'account_nfts'::regclass
        ) THEN
          ALTER TABLE "account_nfts"
            ADD CONSTRAINT "FK_account_nfts_order"
            FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE;
        END IF;
      END $$
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_account_nfts_phone" ON "account_nfts" ("phone")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_account_nfts_region" ON "account_nfts" ("regionSlug")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_account_nfts_order" ON "account_nfts" ("orderId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_account_nfts_status" ON "account_nfts" ("status")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "account_nfts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "nakta_coin_transactions"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftMetadataUri"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftContractAddress"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardNetwork"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardDescription"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardImage"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardName"`);
    await queryRunner.query(`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nftRewardEveryOrders"`);
  }
}
