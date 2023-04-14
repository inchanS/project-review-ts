import { MigrationInterface, QueryRunner } from 'typeorm';

export class defaultSetup1680523680553 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
          INSERT INTO feed_status (id, is_status)
          VALUES (1, 'published'),
                 (2, 'temporary'),
                 (3, 'deleted');
      `
    );

    await queryRunner.query(
      `
          INSERT INTO estimation (id, estimation)
          VALUES (1, 'double like'),
                 (2, 'like'),
                 (3, 'dislike');
      `
    );

    await queryRunner.query(`
        INSERT INTO symbol (id, symbol)
        VALUES (1, 'like'),
               (2, 'I have this too');
    `);

    await queryRunner.query(`
        INSERT INTO categories (id, category)
        VALUES (1, '1 Category'),
               (2, '2 Category'),
               (3, '3 Category'),
               (4, '4 Category'),
               (5, '5 Category');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
