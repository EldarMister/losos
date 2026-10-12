import { MigrationInterface, QueryRunner } from "typeorm";
export class AddOrderCategorySnapshot1785012000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    // Deliberately no backfill: today's category cannot describe a historical purchase.
    await runner.query(`ALTER TABLE "order_items" ADD COLUMN "categoryName" varchar(160)`);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE "order_items" DROP COLUMN "categoryName"`);
  }
}
