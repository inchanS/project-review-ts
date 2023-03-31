import { MigrationInterface, QueryRunner } from 'typeorm';

export class tableUsers1680277626654 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
         CREATE TABLE users
         (
             id         INT          NOT NULL PRIMARY KEY AUTO_INCREMENT,
             created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
             updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
             deleted_at TIMESTAMP    NULL,
             nickname   VARCHAR(255) NOT NULL,
             password   VARCHAR(255) NOT NULL,
             email      VARCHAR(255) NOT NULL,
             UNIQUE KEY idx_users_nickname (nickname),
             UNIQUE KEY idx_users_email (email)
         );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
