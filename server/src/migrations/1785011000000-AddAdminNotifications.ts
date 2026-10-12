import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdminNotifications1785011000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS admin_order_events (
      sequence BIGSERIAL PRIMARY KEY,
      id uuid NOT NULL UNIQUE,
      "orderId" uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
      "orderNumber" integer NOT NULL,
      "regionSlug" varchar(100) NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "pushProcessedAt" timestamptz
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS admin_order_events_pending_idx
      ON admin_order_events (sequence) WHERE "pushProcessedAt" IS NULL`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "staffId" uuid NOT NULL REFERENCES admin_staff(id) ON DELETE CASCADE,
      "sessionId" uuid NOT NULL REFERENCES admin_sessions(id) ON DELETE CASCADE,
      "endpointHash" varchar(64) NOT NULL UNIQUE,
      endpoint text NOT NULL,
      p256dh varchar(180) NOT NULL,
      auth varchar(100) NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS admin_push_staff_idx ON admin_push_subscriptions ("staffId")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS admin_push_subscriptions");
    await queryRunner.query("DROP TABLE IF EXISTS admin_order_events");
  }
}
