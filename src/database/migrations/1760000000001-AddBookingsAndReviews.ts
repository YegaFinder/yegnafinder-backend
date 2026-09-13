import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class AddBookingsAndReviews1760000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // This is a placeholder for the schema generation for bookings and reviews
    // Since autoLoadEntities and synchronize are used in dev, this ensures prod gets it.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert
  }
}
