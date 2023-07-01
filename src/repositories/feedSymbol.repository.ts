import { FeedSymbol } from '../entities/feedSymbol.entity';
import dataSource from './data-source';
import { Pagination } from './feed.repository';
import { Repository } from 'typeorm';

export class FeedSymbolRepository {
  private repository: Repository<FeedSymbol>;

  constructor() {
    this.repository = dataSource.getRepository(FeedSymbol);
  }
  async getFeedSymbol(feedId: number, userId: number) {
    return await this.repository.findOne({
      loadRelationIds: true,
      where: {
        feed: { id: feedId },
        user: { id: userId },
      },
    });
  }

  // 사용자별 좋아요 총 개수 가져오기
  async getFeedSymbolCountByUserId(userId: number) {
    return await this.repository.countBy({
      user: { id: userId },
    });
  }

  async getFeedSymbolsByUserId(userId: number, page: Pagination) {
    let queryBuilder = this.repository
      .createQueryBuilder('feedSymbol')
      .select([
        'feedSymbol.id',
        'feedSymbol.created_at',
        'feedSymbol.updated_at',
      ])
      .addSelect(['feed.id', 'feed.title'])
      .addSelect(['symbol.id', 'symbol.symbol'])
      .addSelect(['feedUser.id', 'feedUser.nickname'])
      .leftJoin('feedSymbol.feed', 'feed')
      .leftJoin('feed.user', 'feedUser')
      .leftJoin('feedSymbol.user', 'user')
      .leftJoin('feedSymbol.symbol', 'symbol')
      .where('user.id = :userId', { userId: userId })
      .orderBy('feedSymbol.updated_at', 'DESC');

    if (Number.isInteger(page?.startIndex) && Number.isInteger(page?.limit)) {
      queryBuilder = queryBuilder.skip(page.startIndex - 1).take(page.limit);
    }

    return await queryBuilder.getMany();
  }

  async upsertFeedSymbol(feedSymbolInfo: FeedSymbol) {
    await this.repository
      .upsert(feedSymbolInfo, ['feed', 'user'])
      .catch((err: Error) => {
        if (
          err.message ===
          'Cannot update entity because entity id is not set in the entity.'
        ) {
          // 업데이트 할 내용이 기존의 내용과 다르지 않다는 에러메세지 처리
          const error = new Error('NOT_CHANGED_FEED_SYMBOL');
          error.status = 400;
          throw error;
        }
      });
  }

  async deleteFeedSymbol(feedSymbolId: number) {
    await this.repository.delete(feedSymbolId);
  }
}
