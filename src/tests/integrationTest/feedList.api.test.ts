import { TestInitializer } from './testUtils/testInitializer';
import { TestUserInfo } from '../../types/test';
import { TestUserFactory } from './testUtils/testUserFactory';
import { MakeTestClass } from './testUtils/makeTestClass';
import { UploadFiles } from '../../entities/uploadFiles.entity';
import dataSource from '../../repositories/data-source';
import { User } from '../../entities/users.entity';
import { Feed } from '../../entities/feed.entity';
import { FeedSymbol } from '../../entities/feedSymbol.entity';
import { ObjectLiteral } from 'typeorm';

TestInitializer.initialize('FeedList API test', () => {
  describe('set for FeedList API test', () => {
    // feed's user
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

      const [user, uploadFile, feed, feedsymbol]: Awaited<ObjectLiteral[]>[] =
        await Promise.all([
          dataSource.manager.find(User),
          dataSource.manager.find(UploadFiles),
          dataSource.manager.find(Feed),
          dataSource.manager.find(FeedSymbol),
        ]);

      console.log('🔥feedList.api.test/:84- user = ', user);
      console.log('🔥feedList.api.test/:85- uploadFile = ', uploadFile);
      console.log('🔥feedList.api.test/:86- feed = ', feed);
      console.log('🔥feedList.api.test/:87- feedsymbol = ', feedsymbol);
    });

    test('test', async () => {
      const abc = 'abc';

      expect(abc).toBe(abc);
    });
  });
});
