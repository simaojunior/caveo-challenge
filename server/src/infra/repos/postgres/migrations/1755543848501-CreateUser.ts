import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUser1755543848501 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        CREATE TYPE "users_role_enum" AS ENUM('admin', 'user')
      `);

      await queryRunner.query(`
        CREATE TABLE "users" (
          "id" uuid NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "email" VARCHAR(255) NOT NULL,
          "role" "users_role_enum" NOT NULL DEFAULT 'user',
          "is_onboarded" boolean NOT NULL DEFAULT false,
          "external_id" VARCHAR(255),
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          CONSTRAINT "UQ_users_email" UNIQUE ("email"),
          CONSTRAINT "UQ_users_external_id" UNIQUE ("external_id"),
          CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
        )
      `);

      await queryRunner.query(`
        CREATE INDEX "idx_user_email" ON "users" ("email")
      `);

      await queryRunner.query(`
        CREATE INDEX "idx_user_role" ON "users" ("role")
      `);

      await queryRunner.query(`
        CREATE INDEX "idx_user_external_id" ON "users" ("external_id")
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('DROP INDEX "idx_user_external_id"');
      await queryRunner.query('DROP INDEX "idx_user_role"');
      await queryRunner.query('DROP INDEX "idx_user_email"');

      await queryRunner.query('DROP TABLE "users"');

      await queryRunner.query('DROP TYPE "users_role_enum"');
    }

}
