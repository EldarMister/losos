import { MigrationInterface, QueryRunner } from "typeorm";
export class AddSiteContacts1785014000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE site_contact_settings (
      id smallint PRIMARY KEY CHECK (id=1), "global" jsonb NOT NULL DEFAULT '{}'::jsonb,
      overrides jsonb NOT NULL DEFAULT '{}'::jsonb, "updatedAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query('INSERT INTO site_contact_settings (id) VALUES (1)');
  }
  async down(queryRunner: QueryRunner): Promise<void> { await queryRunner.query('DROP TABLE site_contact_settings'); }
}
