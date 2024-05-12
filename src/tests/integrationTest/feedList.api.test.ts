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
    const numberOfCategory1FeedsPerUser: number[] = [5, 4, 3];
    const numberOfCategory2FeedsPerUser: number[] = [3, 2];
    const numberOfCategory3FeedsPerUser: number[] = [2, 1];

    let category1FeedInitialId: number = 1;
    const category1Feeds: Feed[] = numberOfCategory1FeedsPerUser.reduce(
      (prev: Feed[], feedCount: number, index: number) => {
        const feeds: Feed[] = new MakeTestClass(
          users[index].id
        ).generateMultipleFeeds(feedCount, category1FeedInitialId, 1);
        category1FeedInitialId += feedCount;
        return prev.concat(feeds);
      },
      []
    );

    let category2FeedInitialId: number = category1Feeds.length + 1;
    const category2Feeds: Feed[] = numberOfCategory2FeedsPerUser.reduce(
      (prev: Feed[], feedCount: number, index: number) => {
        const feeds: Feed[] = new MakeTestClass(
          users[index].id
        ).generateMultipleFeeds(feedCount, category2FeedInitialId, 2);
        category2FeedInitialId += feedCount;
        return prev.concat(feeds);
      },
      []
    );

    let category3FeedInitialId: number = category2FeedInitialId + 1;
    const category3Feeds: Feed[] = numberOfCategory3FeedsPerUser.reduce(
      (prev: Feed[], feedCount: number, index: number) => {
        const feeds: Feed[] = new MakeTestClass(
          users[index].id
        ).generateMultipleFeeds(feedCount, category3FeedInitialId, 3);
        category3FeedInitialId += feedCount;
        return prev.concat(feeds);
      },
      []
    );

    const allFeeds: Feed[] = [
      ...category1Feeds,
      ...category2Feeds,
      ...category3Feeds,
    ];

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
        await transactionalEntityManager.save(Feed, allFeeds);
        await transactionalEntityManager.save(UploadFiles, uploadFiles);
        await transactionalEntityManager.save(FeedSymbol, feedSymbols);
      });
    });

    const endpoint: string = '/feeds/post';
    const paginationDefaultLimit: number = 10;

    describe('verify length of feedList', () => {
      const testFeedList = async (pagination?: Pagination) => {
        const response: Response = await request(app).get(
          `${endpoint}${
            pagination
              ? `?index=${pagination.startIndex}&limit=${pagination.limit}`
              : ''
          }`
        );
        const result = response.body;
        const expectedLength: number =
          pagination && pagination.limit > allFeeds.length
            ? allFeeds.length
            : pagination
            ? pagination.limit
            : paginationDefaultLimit;

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(expectedLength);
      };

      describe('get feedList', () => {
        test('default API', async () => {
          await testFeedList();
        });

        const testQueryStrings: Pagination[] = [
          { startIndex: 0, limit: 1 },
          { startIndex: 0, limit: 5 },
          { startIndex: 0, limit: 12 },
          { startIndex: 0, limit: 100 },
        ];

        testQueryStrings.forEach(pagination => {
          test(`use Query String: index=${pagination.startIndex}&limit=${pagination.limit}`, async () => {
            await testFeedList(pagination);
          });
        });
      });

      const testQueryStringsOfCategories = [
        null,
        { category: 0, expect: paginationDefaultLimit },
        {
          category: 1,
          expect: Math.min(paginationDefaultLimit, category1Feeds.length),
        },
        {
          category: 2,
          expect: Math.min(paginationDefaultLimit, category2Feeds.length),
        },
        {
          category: 3,
          expect: Math.min(paginationDefaultLimit, category3Feeds.length),
        },
      ];

      testQueryStringsOfCategories.forEach(sort => {
        test(`use Query String Category: category=${sort?.category}`, async () => {
          const response: Response = await request(app).get(
            `${endpoint}${sort?.category ? `?categoryId=${sort.category}` : ''}`
          );

          const result = response.body;
          const expectedLength: number = sort?.expect
            ? sort.expect
            : paginationDefaultLimit;

          expect(result).toHaveLength(expectedLength);
        });
      });
    });
  });
});
