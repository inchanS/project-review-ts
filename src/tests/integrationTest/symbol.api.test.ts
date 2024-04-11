import { Express } from 'express';
import { createApp } from '../../app';
import dataSource from '../../repositories/data-source';
import { TestUserFactory } from './testUtils/testUserFactory';
import { TestUtils } from './testUtils/testUtils';
import { Feed } from '../../entities/feed.entity';
import { MakeTestClass } from './testUtils/makeTestClass';
import { FeedSymbol } from '../../entities/feedSymbol.entity';
import { User } from '../../entities/users.entity';
import { Response } from 'superagent';
import request from 'supertest';
import { Symbol, symbolType } from '../../entities/symbol.entity';
import { ApiRequestHelper } from './testUtils/apiRequestHelper';

const app: Express = createApp();

describe('Symbol API', () => {
  beforeAll(async () => {
    await dataSource
      .initialize()
      .then(() => {
        if (process.env.NODE_ENV === 'test') {
          console.log(
            '💥TEST Data Source for Symbol API has been initialized!'
          );
        }
      })
      .catch(error => {
        console.log('Data Source for Symbol API Initializing failed:', error);
      });
  });

  afterAll(async () => {
    await TestUtils.clearDatabaseTables(dataSource);
    await dataSource.destroy().then(() => {
      console.log('💥TEST Data Source has been destroyed!');
    });
  });

  describe('get Symbol List', () => {
    // test users
    const existingUser: TestUserInfo = {
      id: 1,
      nickname: 'existingNickname',
      password: 'existingPassword@1234',
      email: 'existingEmail@email.com',
    };

    const existingUserEntity: TestUserInfo =
      TestUserFactory.createUserEntity(existingUser);
    const existingUserSigningInfo: TestSignIn =
      TestUserFactory.createSignInInfo(existingUser);

    const otherUser: TestUserInfo = {
      id: 2,
      nickname: 'otherUserNickname',
      email: 'otherUser@email.com',
      password: 'otherUserPassword@1234',
    };
    const otherUserEntity: TestUserInfo =
      TestUserFactory.createUserEntity(otherUser);

    const anotherUser: TestUserInfo = {
      id: 3,
      nickname: 'anotherUserNickname',
      email: 'anotherUser@email.com',
      password: 'anotherUserPassword@1234',
    };
    const anotherUserEntity: TestUserInfo =
      TestUserFactory.createUserEntity(anotherUser);

    // test feeds
    const existingUserFeeds: Feed[] = [
      new MakeTestClass(1, existingUser.id).feedData(),
      new MakeTestClass(2, existingUser.id).feedData(),
      new MakeTestClass(3, existingUser.id).feedData(),
    ];

    const otherUserFeeds: Feed[] = [
      new MakeTestClass(4, otherUser.id).feedData(),
      new MakeTestClass(5, otherUser.id).feedData(),
      new MakeTestClass(6, otherUser.id).feedData(),
    ];

    const anotherUserFeeds: Feed[] = [
      new MakeTestClass(7, anotherUser.id).feedData(),
      new MakeTestClass(8, anotherUser.id).feedData(),
      new MakeTestClass(9, anotherUser.id).feedData(),
    ];

    const testFeeds: Feed[] = TestUtils.sortedMergedById(
      existingUserFeeds,
      otherUserFeeds,
      anotherUserFeeds
    );

    // test feed symbols
    const existingUserFeedSybols: FeedSymbol[] = [
      new MakeTestClass(1, existingUser.id).feedSymbolData(7, 1),
    ];
    const otherUserFeedSybols: FeedSymbol[] = [
      new MakeTestClass(2, otherUser.id).feedSymbolData(7, 2),
      new MakeTestClass(2, otherUser.id).feedSymbolData(8, 1),
    ];
    const testFeedSymbols: FeedSymbol[] = TestUtils.sortedMergedById(
      existingUserFeedSybols,
      otherUserFeedSybols
    );

    beforeAll(async () => {
      await dataSource.transaction(async transactionalEntityManager => {
        // 이미 존재하는 유저 생성
        await transactionalEntityManager.save(User, [
          existingUserEntity,
          otherUserEntity,
          anotherUserEntity,
        ]);
        await transactionalEntityManager.save(Feed, testFeeds);
        await transactionalEntityManager.save(FeedSymbol, testFeedSymbols);
      });
    });

    afterAll(async () => {
      await TestUtils.clearDatabaseTables(dataSource);
    });

    test('get Symbol List', async () => {
      const endpoint: string = '/symbols';
      const result: Response = await request(app).get(endpoint);

      expect(result.status).toBe(200);
      expect(result.body).toBeInstanceOf(Array);
      expect(result.body.length).toBe(2);
      expect(result.body.every((item: Symbol) => item.hasOwnProperty('id')));
      expect(
        result.body.every((item: Symbol) => item.hasOwnProperty('symbol'))
      );
      expect(
        result.body.every((item: Symbol) =>
          Object.values(symbolType).includes(item.symbol)
        )
      ).toBe(true);

      expect(result.body.find((item: Symbol) => item.id === 1).symbol).toEqual(
        'like'
      );
      expect(result.body.find((item: Symbol) => item.id === 2).symbol).toEqual(
        'I have this too'
      );
    });

    describe('get count of FeedSymbol', () => {
      const endpoint: string = '/symbols';

      test('get count of Symbols by Feeds with all FeedSymbols: success', async () => {
        const testFeedId: string = '/7';
        const result: Response = await request(app).get(endpoint + testFeedId);

        expect(result.status).toBe(200);
        expect(result.body).toBeInstanceOf(Array);
        expect(result.body.length).toBe(2);
        expect(
          result.body.find((item: Symbol) => item.symbol === 'like').count
        ).toBe(1);
        expect(
          result.body.find((item: Symbol) => item.symbol === 'I have this too')
            .count
        ).toBe(1);
      });

      test('get count of Symbols by Feeds with a FeedSymbol: success', async () => {
        const testFeedId: string = '/8';
        const result: Response = await request(app).get(endpoint + testFeedId);

        expect(result.status).toBe(200);
        expect(result.body).toBeInstanceOf(Array);
        expect(result.body.length).toBe(1);
        expect(
          result.body.find((item: Symbol) => item.symbol === 'like').count
        ).toBe(1);
      });

      test('get count of Symbols by Feeds without FeedSymbol', async () => {
        const testFeedId: string = '/9';
        const result: Response = await request(app).get(endpoint + testFeedId);

        expect(result.status).toBe(200);
        expect(result.body).toBeInstanceOf(Array);
        expect(result.body.length).toBe(1);
        expect(result.body[0].symbol).toBe(null);
        expect(result.body[0].count).toBe(0);
      });

      test('invalid Feed', async () => {
        const invalidFeedId: string = '/11';
        const result: Response = await request(app).get(
          endpoint + invalidFeedId
        );

        expect(result.status).toBe(404);
        expect(result.body).toEqual({ message: 'NOT_FOUND_FEED' });
      });
    });

    describe('check FeedSymbol of Signing User by Feed', () => {
      const endpoint: string = '/symbols/check';

      test('check FeedSymbol: true', async () => {
        const testFeedId: number = 7;
        const stringTestFeedId: string = `/${testFeedId}`;
        const result: Response = await ApiRequestHelper.makeAuthGetRequest(
          app,
          existingUserSigningInfo,
          endpoint + stringTestFeedId
        );

        expect(result.status).toBe(200);
        expect(result.body.checkValue).toBe(true);
        expect(result.body.result.user).toBe(existingUser.id);
        expect(result.body.result.feed).toBe(testFeedId);
      });

      test('check FeedSymbol: false', async () => {
        const testFeedId: number = 8;
        const stringTestFeedId: string = `/${testFeedId}`;
        const result: Response = await ApiRequestHelper.makeAuthGetRequest(
          app,
          existingUserSigningInfo,
          endpoint + stringTestFeedId
        );

        console.log('🔥symbol.api.test/:232- result = ', result.body);

        expect(result.status).toBe(200);
        expect(result.body.checkValue).toBe(false);
        expect(result.body.result).toBe(null);
      });
    });
  });
});
