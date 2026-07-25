import type { MigrationInterface, QueryRunner } from "typeorm";

export class AllowFractionalWeight1784981000000 implements MigrationInterface {
  name = "AllowFractionalWeight1784981000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ALTER COLUMN "weight" TYPE real
      USING "weight"::real
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ALTER COLUMN "weight" TYPE integer
      USING round("weight")::integer
    `);
  }
}
