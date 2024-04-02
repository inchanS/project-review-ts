import { FeedSymbol } from '../entities/feedSymbol.entity';
import { CustomError } from '../utils/util';
import { DataSource } from 'typeorm';

export class FeedSymbolCustomRepository {
  constructor(private dataSource: DataSource) {}

  private get feedSymbolRepository() {
    return this.dataSource.getRepository(FeedSymbol);
  }
  async getFeedSymbol(
    feedId: number,
    userId: number
  ): Promise<FeedSymbol | null> {
    return await this.feedSymbolRepository.findOne({
      loadRelationIds: true,
      where: {
        feed: { id: feedId },
        user: { id: userId },
      },
    });
  }

  // 사용자별 좋아요 총 개수 가져오기
  async getFeedSymbolCountByUserId(userId: number) {
    return await this.feedSymbolRepository.countBy({
      user: { id: userId },
    });
  }

  async getFeedSymbolsByUserId(userId: number, page: Pagination | undefined) {
    let queryBuilder = this.feedSymbolRepository
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

    if (
      page &&
      Number.isInteger(page?.startIndex) &&
      Number.isInteger(page?.limit)
    ) {
      queryBuilder = queryBuilder.skip(page.startIndex - 1).take(page.limit);
    }

    return await queryBuilder.getMany();
  }

  async upsertFeedSymbol(feedSymbolInfo: FeedSymbol): Promise<void> {
    await this.feedSymbolRepository
      .upsert(feedSymbolInfo, ['feed', 'user'])
      .catch((err: Error) => {
        if (
          err.message ===
          'Cannot update entity because entity id is not set in the entity.'
        ) {
          // 업데이트 할 내용이 기존의 내용과 다르지 않다는 에러메세지 처리
          throw new CustomError(400, 'NOT_CHANGED_FEED_SYMBOL');
        }
      });
  }

  async deleteFeedSymbol(feedSymbolId: number): Promise<void> {
    await this.feedSymbolRepository.delete(feedSymbolId);
  }

  async findByUserId(userId: number): Promise<FeedSymbol[]> {
    return await this.feedSymbolRepository.find({
      loadRelationIds: true,
      where: { user: { id: userId } },
    });
  }
}
