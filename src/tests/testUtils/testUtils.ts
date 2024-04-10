import { Response } from 'superagent';
import { DataSource } from 'typeorm';

export class TestUtils {
  // 사용자 아이디 조회시 반환값의 종류와 유형 및 값을 정확히 반환하고 있는지 확인하는 메소드
  public static validateUser(result: Response, userInfo: TestUserInfo) {
    expect(result.status).toBe(200);
    expect(Object.keys(result.body)).toHaveLength(6);
    expect(result.body.id).toEqual(userInfo.id);
    expect(result.body.created_at).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
    );
    expect(result.body.updated_at).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
    );
    expect(result.body.deleted_at).toEqual(null);
    expect(result.body.nickname).toEqual(userInfo.nickname);
    expect(result.body.email).toEqual(userInfo.email);
  }

  public static sortedMergedById<T extends { id: number }>(
    ...arrays: T[][]
  ): T[] {
    // 스프레드 연산자를 사용하여 배열의 배열을 하나의 배열로 합칩니다.
    const combinedArray: T[] = arrays.flat();
    combinedArray.sort((a: T, b: T) => a.id - b.id);

    return combinedArray;
  }

  public static async clearDatabaseTables(dataSource: DataSource) {
    await dataSource.transaction(async transactionalEntityManager => {
      await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=0;`);
      await transactionalEntityManager.clear('FeedSymbol');
      await transactionalEntityManager.clear('Comment');
      await transactionalEntityManager.clear('Feed');
      await transactionalEntityManager.clear('User');
      await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=1;`);
    });
  }
}
