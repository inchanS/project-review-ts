import dataSource from './index.db';
import { Feed } from '../entities/feed.entity';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import { IsNull, Not } from 'typeorm';

export const FeedRepository = dataSource.getRepository(Feed).extend({
  async createFeed(feedInfo: Feed) {
    const feed = await this.create(feedInfo);
    await this.save(feed);
    return await this.findOne({
      loadRelationIds: true,
      where: { user: feedInfo.user },
      order: { id: 'DESC' },
      take: 1,
    });
  },

  async createOrUpdateFeed(feedId: number, feedInfo: Feed) {
    await this.update(feedId, feedInfo);

    return await this.findOne({
      loadRelationIds: true,
      where: { id: feedId },
    });
  },

  async getFeed(feedId: number) {
    return await this.createQueryBuilder('feed')
      .select([
        'feed.id',
        'feed.title',
        'feed.content',
        'feed.estimation',
        'feed.status',
        'feed.created_at',
        'feed.updated_at',
        'feed.posted_at',
        'feed.categoryId',
        'feed.userId',
        'uploadFiles.file_link',
      ])
      .leftJoinAndSelect('feed.uploadFiles', 'uploadFiles')
      .leftJoinAndSelect('feed.user', 'user')
      .leftJoinAndSelect('feed.category', 'category')
      .leftJoinAndSelect('feed.feedSymbol', 'feedSymbol')
      .where('feed.id = :feedId', { feedId: feedId })
      .getOneOrFail();
  },

  // 피드의 symbol id별 count 가져오기
  async getFeedSymbolCount(feedId: number) {
    return await this.createQueryBuilder('feed')
      .select([
        'feed.id AS feedId',
        'feedSymbol.symbolId',
        'symbol.symbol AS symbol',
        'COUNT(feedSymbol.symbolId) AS count',
      ])
      .leftJoin('feed.feedSymbol', 'feedSymbol')
      .leftJoin('feedSymbol.symbol', 'symbol')
      .where('feed.id = :feedId', { feedId: feedId })
      .groupBy('feedSymbol.symbolId')
      .getRawMany();
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
        postedAt: 'DESC',
      },
      skip: startIndex,
      take: limit,
      where: { categoryId: categoryId, postedAt: Not(IsNull()) },
    });
  },

  async getFeedListByUserId(userId: number) {
    return await this.find({ where: { userId: userId } });
  },

  async getTempFeedList(userId: number) {
    return await this.find({
      where: { userId: userId, statusId: 2 },
    });
  },
});
