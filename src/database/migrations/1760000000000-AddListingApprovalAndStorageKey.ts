import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddListingApprovalAndStorageKey1760000000000
  implements MigrationInterface
{
  name = 'AddListingApprovalAndStorageKey1760000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "businesses"
        ADD COLUMN IF NOT EXISTS "listing_status" varchar(20) NOT NULL DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS "is_public" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "listing_submitted_at" timestamp NULL,
        ADD COLUMN IF NOT EXISTS "listing_reviewed_at" timestamp NULL,
        ADD COLUMN IF NOT EXISTS "listing_reviewed_by_id" uuid NULL,
        ADD COLUMN IF NOT EXISTS "listing_rejection_reason" text NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "business_gallery"
        ADD COLUMN IF NOT EXISTS "storage_key" varchar(500) NULL
    `);
    await queryRunner.query(`
      UPDATE "businesses"
      SET "is_public" = false,
          "listing_status" = 'pending'
      WHERE "listing_status" IS DISTINCT FROM 'approved'
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_businesses_listing_status" ON "businesses" ("listing_status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_businesses_is_public" ON "businesses" ("is_public")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_businesses_is_public"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_businesses_listing_status"`);
    await queryRunner.query(
      `ALTER TABLE "business_gallery" DROP COLUMN IF EXISTS "storage_key"`,
    );
    await queryRunner.query(`
      ALTER TABLE "businesses"
        DROP COLUMN IF EXISTS "listing_rejection_reason",
        DROP COLUMN IF EXISTS "listing_reviewed_by_id",
        DROP COLUMN IF EXISTS "listing_reviewed_at",
        DROP COLUMN IF EXISTS "listing_submitted_at",
        DROP COLUMN IF EXISTS "is_public",
        DROP COLUMN IF EXISTS "listing_status"
    `);
  }
}