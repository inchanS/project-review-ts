import { Express } from 'express';
import { createApp } from '../../app';
import dataSource from '../../repositories/data-source';
import { TestUtils } from './testUtils/testUtils';
import { Feed } from '../../entities/feed.entity';
import { TestUserFactory } from './testUtils/testUserFactory';
import { MakeTestClass } from './testUtils/makeTestClass';
import { User } from '../../entities/users.entity';
import { Response } from 'superagent';
import request from 'supertest';

const app: Express = createApp();

describe('Search API', () => {
  beforeAll(async () => {
    await dataSource
      .initialize()
      .then(() => {
        if (process.env.NODE_ENV === 'test') {
          console.log(
            '💥TEST Data Source for Search API has been initialized!'
          );
        }
      })
      .catch(error => {
        console.log('Data Source for Search API Initializing failed:', error);
      });
  });

  afterAll(async () => {
    await TestUtils.clearDatabaseTables(dataSource);
    await dataSource.destroy().then(() => {
      console.log('💥TEST Data Source for Search API has been destroyed!');
    });
  });

  describe('set Search API', () => {
    // test users
    const testUser: TestUserInfo = {
      id: 1,
      nickname: 'testNickname',
      password: 'testPassword@1234',
      email: 'testEmail@email.com',
    };
    const testUserEntity: TestUserInfo =
      TestUserFactory.createUserEntity(testUser);

    const testQuery: string = 'findMe';
    const testTitle: string = `이것은 제목입니다. 여기에서부터 스닛펫 ${testQuery} 이 있습니다`;
    const testContent: string = `이것은 내용부분입니다. 바로 여기에서부터 내용이 시작되는데 한참 뒤에 스닛펫이 시작될 겁니다. 바로 여기 ${testQuery} 찾고자 하는 스닛펫이 있습니다. 그리고 한참 동안 다른 내용들이 이어지고 있습니다. 어떤 내용들이든 상관 없습니다.`;

    // test feeds
    const testUserFeeds: Feed[] = [
      new MakeTestClass(1, testUser.id).feedData(),
      new MakeTestClass(2, testUser.id).feedData(testTitle, testContent),
      new MakeTestClass(3, testUser.id).feedData(testTitle),
      new MakeTestClass(4, testUser.id).feedData(undefined, testContent),
      new MakeTestClass(5, testUser.id).feedData(),
    ];

    beforeAll(async () => {
      await dataSource.transaction(async transactionalEntityManager => {
        // 이미 존재하는 유저 생성
        await transactionalEntityManager.save(User, testUserEntity);
        await transactionalEntityManager.save(Feed, testUserFeeds);
      });
    });

    afterAll(async () => {
      await TestUtils.clearDatabaseTables(dataSource);
    });

    describe('search test', () => {
      const endpoint: string = '/search?query=';
      const testEndpoint: string = endpoint + testQuery;

      test('get search API test: success', async () => {
        const result: Response = await request(app).get(testEndpoint);

        expect(result.status).toBe(200);
        expect(result.body).toBeInstanceOf(Array);
        expect(result.body.length).toBe(3);

        const feedWithTitleAndContent = result.body.find(
          (item: any) => item.id === 2
        );
        expect(feedWithTitleAndContent.titleSnippet).toContain(testQuery);
        expect(feedWithTitleAndContent.contentSnippet).toContain(testQuery);

        // String.startsWith  메소드로 '...'로 시작하는지 여부를 찾는 방법
        const startsWithDotsTitle: boolean =
          feedWithTitleAndContent.titleSnippet.startsWith('...');
        // 정규식으로 '...'로 시작하는지 여부를 찾는 방법
        const regexStart: RegExp = /^\.{3}/; // 선두에 세 개의 점이 있는지 검사하는 정규 표현식
        const startsWithDotsContent: boolean = regexStart.test(
          feedWithTitleAndContent.contentSnippet
        );
        expect(startsWithDotsTitle).toBe(true);
        expect(startsWithDotsContent).toBe(true);

        const endsWithDotsContent: boolean =
          feedWithTitleAndContent.contentSnippet.endsWith('...');
        const regexEnd: RegExp = /\.{3}$/; // 문자열이 세 개의 점으로 끝나는지 검사하는 정규 표현식
        const endsWithDotsTitle: boolean = regexEnd.test(
          feedWithTitleAndContent.titleSnippet
        );
        expect(endsWithDotsTitle).toBe(true);
        expect(endsWithDotsContent).toBe(true);

        const feedWithContent = result.body.find((item: any) => item.id === 4);
        expect(feedWithContent.contentSnippet).toContain(testQuery);

        const feedWithTitle = result.body.find((item: any) => item.id === 3);
        expect(feedWithTitle.titleSnippet).toContain(testQuery);

        // 순서
        expect(result.body[0].id).toBe(4);
        expect(result.body[result.body.length - 1].id).toBe(2);
      });

      test('get search API test: null', async () => {
        const nullTestEndpoint = '/search?query=abcde';
        const result: Response = await request(app).get(nullTestEndpoint);

        expect(result.status).toBe(200);
        expect(result.body).toBeInstanceOf(Array);
        expect(result.body.length).toBe(0);
      });

      test('get search API test: with index and limit', async () => {
        const index: number = 1;
        const limit: number = 2;
        const testEndpointWithIndexAndLimit: string =
          testEndpoint + `&index=${index}&limit=${limit}`;
        const result: Response = await request(app).get(
          testEndpointWithIndexAndLimit
        );

        expect(result.status).toBe(200);
        expect(result.body).toBeInstanceOf(Array);
        expect(result.body.length).toBe(2);
        expect(result.body[0].id).toBe(3);
        expect(result.body[result.body.length - 1].id).toBe(2);
      });

      test('get search API test: Failure - PAGE_START_INDEX_OR LIMIT_IS_INVALID', async () => {
        const index: number = -1;
        const limit: number = 2;
        const testEndpointWithIndexAndLimit: string =
          testEndpoint + `&index=${index}&limit=${limit}`;
        const result: Response = await request(app).get(
          testEndpointWithIndexAndLimit
        );

        expect(result.status).toBe(400);
        expect(result.body.message).toBe(
          'PAGE_START_INDEX_OR LIMIT_IS_INVALID'
        );
      });

      test('get search API test: Failure - WHEN_AN_INDEX_IS_PRESENT,_THE_LIMIT_MUST_BE_GREATER_THAN_0', async () => {
        const index: number = 2;
        const limit: number = 0;
        const testEndpointWithIndexAndLimit: string =
          testEndpoint + `&index=${index}&limit=${limit}`;
        const result: Response = await request(app).get(
          testEndpointWithIndexAndLimit
        );

        expect(result.status).toBe(400);
        expect(result.body.message).toBe(
          'WHEN_AN_INDEX_IS_PRESENT,_THE_LIMIT_MUST_BE_GREATER_THAN_0'
        );
      });
    });
  });
});
