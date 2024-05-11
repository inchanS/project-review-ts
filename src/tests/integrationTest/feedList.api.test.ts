import { TestInitializer } from './testUtils/testInitializer';
import { TestUserInfo } from '../../types/test';
import { TestUserFactory } from './testUtils/testUserFactory';
import { MakeTestClass } from './testUtils/makeTestClass';
import { UploadFiles } from '../../entities/uploadFiles.entity';
import dataSource from '../../repositories/data-source';
import { User } from '../../entities/users.entity';
import { Feed } from '../../entities/feed.entity';
import { FeedSymbol } from '../../entities/feedSymbol.entity';
import { Response } from 'superagent';
import request from 'supertest';
import { createApp } from '../../app';
import { Express } from 'express';

const app: Express = createApp();

TestInitializer.initialize('FeedList API test', () => {
  describe('set for FeedList API test', () => {
    // test users
    const numberOfUsers: number = 10;
    const users: TestUserInfo[] =
      TestUserFactory.generateMultipleUsers(numberOfUsers);

    // feed's upload files
    const user1TextFiles: UploadFiles[] = new MakeTestClass(
      users[0].id
    ).generateMultipleUploadData(2, 1, 'txt');
    const user1ImageFiles: UploadFiles[] = new MakeTestClass(
      users[0].id
    ).generateMultipleUploadData(2, 3, 'jpg');

    const uploadFiles: UploadFiles[] = [...user1TextFiles, ...user1ImageFiles];

    // test feeds
    const numberOfFeedsPerUser: number[] = [5, 4, 3];
    const numberOfTotalFeeds: number = numberOfFeedsPerUser.reduce(
      (acc, value) => {
        return acc + value;
      }
    );
    let feedInitialUserId: number = 1;

    const feeds: Feed[] = numberOfFeedsPerUser.reduce(
      (prev: Feed[], feedCount: number, index: number) => {
        const feeds: Feed[] = new MakeTestClass(
          users[index].id
        ).generateMultipleFeeds(feedCount, feedInitialUserId);
        feedInitialUserId += feedCount;
        return prev.concat(feeds);
      },
      []
    );

    // feedSymbols
    const numberOfFeedSymbolsPerFeed: number[] = [5, 3];
    const feedSymbolIds: number[] = [1, 2];
    let feedSymbolInitialUserId: number = 2;

    const feedSymbols: FeedSymbol[] = numberOfFeedSymbolsPerFeed.reduce(
      (prev: FeedSymbol[], numSymbols: number, index: number) => {
        const feedSymbols: FeedSymbol[] = new MakeTestClass(
          1
        ).generateFeedSymbolDatas(
          1,
          feedSymbolIds[index] as 1 | 2,
          numSymbols,
          feedSymbolInitialUserId
        );
        feedSymbolInitialUserId += numSymbols;
        return prev.concat(feedSymbols);
      },
      []
    );

    beforeAll(async () => {
      await dataSource.transaction(async transactionalEntityManager => {
        await transactionalEntityManager.save(User, users);
        await transactionalEntityManager.save(Feed, feeds);
        await transactionalEntityManager.save(UploadFiles, uploadFiles);
        await transactionalEntityManager.save(FeedSymbol, feedSymbols);
      });
    });

    describe('get feedList - default API', () => {
      const endpoint: string = '/feeds/post';
      const limit: number = 10;

      let result: Response;
      beforeAll(async () => {
        const response: Response = await request(app).get(endpoint);
        result = response.body;
      });

      test('get feedList', async () => {
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(limit);
      });
    });

    describe('get feedList - use Query String: index&limit', () => {
      const endpoint: string = '/feeds/post';

      const testQeuryString: Pagination[] = [
        { startIndex: 0, limit: 1 },
        { startIndex: 0, limit: 5 },
        { startIndex: 0, limit: 12 },
        { startIndex: 0, limit: 100 },
      ];
      test.each(testQeuryString)('get feedList', async pagination => {
        const response: Response = await request(app).get(
          `${endpoint}?index=${pagination.startIndex}&limit=${pagination.limit}`
        );
        const result = response.body;

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(
          pagination.limit > numberOfTotalFeeds
            ? numberOfTotalFeeds
            : pagination.limit
        );
      });
    });
  });
});
