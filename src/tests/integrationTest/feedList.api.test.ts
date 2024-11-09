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
import { FeedList } from '../../entities/viewEntities/viewFeedList.entity';

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

    const idsOfAllFeeds: number[] = allFeeds.map((feed: Feed) => feed.id);
    idsOfAllFeeds.sort((a, b) => b - a);

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

    describe('verify the length of feedList based on query string parameters', () => {
      const getExpectedLength = (
        pagination: Pagination | null,
        feedsLength: number
      ) => {
        if (!pagination) return paginationDefaultLimit;

        const min: number = Math.min(pagination.limit, feedsLength);

        if (pagination.startIndex === 0) {
          return min;
        } else {
          return Math.max(0, min - pagination.startIndex);
        }
      };

      const paginationOptions: Pagination[] = [
        { startIndex: 0, limit: 1 },
        { startIndex: allFeeds.length, limit: 10 },
        { startIndex: 0, limit: 12 },
        { startIndex: 0, limit: 20 },
        { startIndex: 10, limit: 20 },
        { startIndex: allFeeds.length, limit: 20 },
        { startIndex: 0, limit: 100 },
        { startIndex: 15, limit: 100 },
      ];

      interface CategoryOptions {
        category: number;
        feeds: Feed[];
        expect: number;
      }

      const categoryOptions: CategoryOptions[] = [
        {
          category: 0,
          feeds: allFeeds,
          expect: paginationDefaultLimit,
        },
        {
          category: 1,
          feeds: category1Feeds,
          expect: Math.min(paginationDefaultLimit, category1Feeds.length),
        },
        {
          category: 2,
          feeds: category2Feeds,
          expect: Math.min(paginationDefaultLimit, category2Feeds.length),
        },
        {
          category: 3,
          feeds: category3Feeds,
          expect: Math.min(paginationDefaultLimit, category3Feeds.length),
        },
      ];

      const sendRequest = async (
        pagination?: Pagination,
        categoryId?: number
      ) =>
        await request(app).get(
          `${endpoint}${
            pagination
              ? `?index=${pagination.startIndex}&limit=${pagination.limit}${
                  categoryId ? `&categoryId=${categoryId}` : ''
                }`
              : categoryId
              ? `?categoryId=${categoryId}`
              : ''
          }`
        );

      // Test default API
      test('not use Query String', async () => {
        const response: Response = await request(app).get(endpoint);
        const result: FeedList[] = response.body;

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(
          Math.min(allFeeds.length, paginationDefaultLimit)
        );
      });

      // Test pagination only
      paginationOptions.forEach((pagination: Pagination) => {
        const indexString: string = pagination
          ? `?index=${pagination.startIndex}&limit=${pagination.limit}`
          : '';

        test(`use Query String for pagination only: endpoint${indexString}`, async () => {
          const response: Response = await sendRequest(pagination);
          const result: FeedList[] = response.body;
          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(
            getExpectedLength(pagination, allFeeds.length)
          );

          if (result.length > 0) {
            expect(result[0].id).toBe(idsOfAllFeeds[0 + pagination.startIndex]);
          }
        });
      });

      // Test category only
      categoryOptions.forEach(sort => {
        const categoryIdString: string = sort
          ? `?categoryId=${sort.category}`
          : '';

        test(`use Query String for category only: endpoint${categoryIdString}`, async () => {
          const response: Response = await sendRequest(
            undefined,
            sort.category
          );
          const result = response.body;
          expect(result).toHaveLength(
            sort.expect ? sort.expect : paginationDefaultLimit
          );
        });
      });

      // Test pagination and category together
      const generateTest = (
        pagination: Pagination,
        category: CategoryOptions
      ) => {
        return async () => {
          const response: Response = await sendRequest(
            pagination,
            category.category
          );
          const result = response.body;

          const min: number = Math.min(
            pagination.limit ?? paginationDefaultLimit,
            category.feeds.length
          );

          const expectedLength: number = category.expect
            ? Math.max(0, min - pagination.startIndex)
            : getExpectedLength(pagination, allFeeds.length);

          expect(result).toHaveLength(expectedLength);

          if (category.category !== 0) {
            expect(
              result.every(
                (item: FeedList) => item.categoryId === category.category
              )
            ).toBe(true);
          }

          if (result.length > 0 && pagination && pagination.startIndex > 0) {
            const categoryIds: number[] = category.feeds
              .map(item => item.id)
              .sort((a, b) => b - a);

            expect(result[0].id).toBe(categoryIds[0 + pagination.startIndex]);
          }
        };
      };

      paginationOptions
        .reduce<Array<[string, () => Promise<void>]>>(
          (
            acc: Array<[string, () => Promise<void>]>,
            pagination: Pagination
          ) => {
            return categoryOptions.reduce((acc, category) => {
              const indexString: string = pagination
                ? `?index=${pagination.startIndex}&limit=${pagination.limit}`
                : '';
              const categoryIdString: string = category
                ? `categoryId=${category.category}`
                : '';
              const mark: string = indexString ? '&' : '?';

              const description: string = `use Query String for both pagination and category: endpoint${indexString}${mark}${categoryIdString}`;

              acc.push([description, generateTest(pagination, category)]);
              return acc;
            }, acc);
          },
          []
        )
        .forEach(([description, testFunc]) => {
          it(description, testFunc);
        });
    });
  });
});
