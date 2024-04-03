import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultSetup1712036189830 implements MigrationInterface {
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
        INSERT INTO categories (id, category, description)
        VALUES (1, '음식', '식당, 카페, 디저트 등'),
               (2, '전자제품', '스마트폰, 컴퓨터, 가전제품 등'),
               (3, '의류 및 악세서리', '패션, 의류, 신발, 가방, 액세서리 등'),
               (4, '생활용품', '가구, 주방용품, 화장품, 잡화 등'),
               (5, '화장품', '화장품, 향수, 뷰티 등'),
               (6, '컨텐츠', '영화, 드라마, 음악, 책, 만화, 이벤트 등'),
               (7, '여행', '여행, 관광지, 호텔, 숙박시설 등'),
               (8, '기타', '기타')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      SET FOREIGN_KEY_CHECKS = 0;
    `);

    await queryRunner.query(`
      TRUNCATE TABLE feed_status;
    `);

    await queryRunner.query(`
      TRUNCATE TABLE symbol;
    `);

    await queryRunner.query(`
      TRUNCATE TABLE categories;
    `);

    await queryRunner.query(`
      SET FOREIGN_KEY_CHECKS = 1;
    `);
  }
}
