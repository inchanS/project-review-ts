import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueColumnSymbolAndStatus1710331579857
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE feed_status
            ADD CONSTRAINT status_unique UNIQUE (is_status);
    `);

    await queryRunner.query(`
        ALTER TABLE symbol
            ADD CONSTRAINT symbol_unique UNIQUE (symbol);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE feed_status
            DROP INDEX status_unique;
    `);

    await queryRunner.query(`
        ALTER TABLE symbol
            DROP INDEX symbol_unique;
    `);
  }
}
