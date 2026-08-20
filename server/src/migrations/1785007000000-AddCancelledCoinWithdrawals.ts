import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCancelledCoinWithdrawals1785007000000 implements MigrationInterface {
  name = "AddCancelledCoinWithdrawals1785007000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "nakta_coin_withdrawals" DROP CONSTRAINT IF EXISTS "CHK_coin_withdrawals_status"`);
    await queryRunner.query(`ALTER TABLE "nakta_coin_withdrawals" ADD CONSTRAINT "CHK_coin_withdrawals_status" CHECK ("status" IN ('pending', 'submitted', 'withdrawn', 'failed', 'cancelled'))`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "nakta_coin_withdrawals" SET "status" = 'failed' WHERE "status" = 'cancelled'`);
    await queryRunner.query(`ALTER TABLE "nakta_coin_withdrawals" DROP CONSTRAINT IF EXISTS "CHK_coin_withdrawals_status"`);
    await queryRunner.query(`ALTER TABLE "nakta_coin_withdrawals" ADD CONSTRAINT "CHK_coin_withdrawals_status" CHECK ("status" IN ('pending', 'submitted', 'withdrawn', 'failed'))`);
  }
}
