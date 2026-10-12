import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdminSecurity1785010000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "admin_staff" (
      "id" uuid PRIMARY KEY, "login" varchar(100) NOT NULL UNIQUE,
      "name" varchar(140) NOT NULL, "passwordHash" text NOT NULL,
      "role" varchar(20) NOT NULL CHECK ("role" IN ('OWNER','ADMIN','MANAGER')),
      "active" boolean NOT NULL DEFAULT true, "permissions" jsonb NOT NULL DEFAULT '{}'::jsonb,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE TABLE "admin_sessions" (
      "id" uuid PRIMARY KEY, "staffId" uuid NOT NULL REFERENCES "admin_staff"("id") ON DELETE CASCADE,
      "tokenHash" varchar(64) NOT NULL UNIQUE, "expiresAt" timestamptz NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_admin_sessions_staff" ON "admin_sessions" ("staffId")`);
    await queryRunner.query(`CREATE TABLE "admin_audit" (
      "id" bigserial PRIMARY KEY, "actorId" uuid REFERENCES "admin_staff"("id") ON DELETE SET NULL,
      "actorName" varchar(140) NOT NULL, "action" varchar(120) NOT NULL,
      "target" varchar(300) NOT NULL DEFAULT '', "details" jsonb NOT NULL DEFAULT '{}'::jsonb,
      "createdAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_admin_audit_created" ON "admin_audit" ("createdAt" DESC)`);
    await queryRunner.query(`CREATE TABLE "admin_login_attempts" (
      "key" varchar(64) PRIMARY KEY, "count" integer NOT NULL DEFAULT 0,
      "windowStart" timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE TABLE "admin_customer_profiles" (
      "phone" varchar(30) PRIMARY KEY, "name" varchar(140) NOT NULL DEFAULT '',
      "notes" varchar(2000) NOT NULL DEFAULT '', "updatedAt" timestamptz NOT NULL DEFAULT now()
    )`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_customer_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_login_attempts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_audit"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_staff"`);
  }
}
