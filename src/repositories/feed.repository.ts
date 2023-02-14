import dataSource from './index.db';
import { Feed } from '../entities/feed.entity';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';

export const FeedRepository = dataSource.getRepository(Feed).extend({
  async createFeed(feedInfo: Feed) {
    const feed = await this.create(feedInfo);
    await this.save(feed);
  },
});

export const FeedListRepository = dataSource.getRepository(FeedList).extend({
  async getFeedList(
    categoryId: number | undefined,
    startIndex: number,
    limit: number
  ) {
    if (categoryId === 0) {
      categoryId = undefined;
    }
    return await this.find({
      order: {
        id: 'DESC',
      },
      skip: startIndex,
      take: limit,
      where: { categoryId: categoryId },
    });
  },

  async getFeedListByUserId(userId: number) {
    return await this.find({ where: { userId: userId } });
  },
});
