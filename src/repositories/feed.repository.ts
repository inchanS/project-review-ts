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

  async updateFeed(feedId: number, feedInfo: Feed) {
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
        'user.id',
        'user.nickname',
        'feed.title',
        'feed.content',
        'feed.viewCnt',
        'estimation.id',
        'estimation.estimation',
        'status.id',
        'status.is_status',
        'feed.created_at',
        'feed.updated_at',
        'feed.posted_at',
        'category.id',
        'category.category',
        'uploadFiles.id',
        'uploadFiles.is_img',
        'uploadFiles.file_link',
      ])
      .leftJoin('feed.user', 'user')
      .leftJoin('feed.category', 'category')
      .leftJoin('feed.estimation', 'estimation')
      .leftJoin('feed.status', 'status')
      .leftJoin('feed.uploadFiles', 'uploadFiles')
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

  async addViewCount(feedId: number) {
    await this.createQueryBuilder()
      .update(Feed)
      .set({ viewCnt: () => 'viewCnt + 1' })
      .where('id = :feedId', { feedId: feedId })
      .execute();
  },
});

export const FeedListRepository = dataSource.getRepository(FeedList).extend({
  async getFeedList(
    categoryId: number | undefined,
    startIndex: number,
    limit: number
  ) {
    return await this.find({
      order: {
        postedAt: 'DESC',
      },
      skip: startIndex,
      take: limit,
      where: {
        categoryId: categoryId,
        postedAt: Not(IsNull()),
        deletedAt: IsNull(),
      },
    });
  },

  async getFeedListByUserId(userId: number) {
    return await this.find({
      where: { userId: userId, postedAt: Not(IsNull()), deletedAt: IsNull() },
    });
  },

  async getTempFeedList(userId: number) {
    return await this.find({
      where: { userId: userId, statusId: 2 },
    });
  },
});
