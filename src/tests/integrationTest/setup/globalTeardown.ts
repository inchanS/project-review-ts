import dataSource from '../../../repositories/data-source';

module.exports = async () => {
  // dataSource table 초기화
  // 외래키 검사 비활성화
  await dataSource.transaction(async transactionalEntityManager => {
    await transactionalEntityManager
      .query(`SET FOREIGN_KEY_CHECKS = 0;`)
      .then(() => {
        console.log('🔥user.api.test - SET FOREIGN_KEY_CHECKS = 0');
      });
    // 모든 일반 테이블명 가져오기
    const tables = await transactionalEntityManager.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'test_project_review'
            AND table_type = 'BASE TABLE';
      `);
    // 모든 일반 테이블 지우기
    for (const table of tables) {
      // dataSource.manager.clear(TABLE_NAME) 메소드는 migrations 테이블까지는 불러오지 못한다.
      await transactionalEntityManager.query(
        `TRUNCATE TABLE ${table.TABLE_NAME};`
      );
    }
    console.log('🔥user.api.test - TRUNCATED ALL TABLES');
    // 외래키 검사 재활성화
    await transactionalEntityManager
      .query(`SET FOREIGN_KEY_CHECKS = 1;`)
      .then(() => {
        console.log('🔥user.api.test - SET FOREIGN_KEY_CHECKS = 1');
      });
  });

  // dataSource 연결 해제
  await dataSource.destroy().then(() => {
    console.log('💥TEST Data Source has been destroyed!');
  });
};
