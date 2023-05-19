import { FeedSymbol } from '../entities/feedSymbol.entity';
import dataSource from './data-source';

export const FeedSymbolRepository = dataSource
  .getRepository(FeedSymbol)
  .extend({
    async getFeedSymbol(feedId: number, userId: number) {
      return await this.findOne({
        loadRelationIds: true,
        where: {
          feed: { id: feedId },
          user: { id: userId },
        },
      });
    },

    // 사용자별 좋아요 총 개수 가져오기
    async getFeedSymbolCountByUserId(userId: number) {
      return await this.countBy({
        user: { id: userId },
      });
    },

    async upsertFeedSymbol(feedSymbolInfo: FeedSymbol) {
      await this.upsert(feedSymbolInfo, ['feed', 'user']).catch(
        (err: Error) => {
          if (
            err.message ===
            'Cannot update entity because entity id is not set in the entity.'
          ) {
            // 업데이트 할 내용이 기존의 내용과 다르지 않다는 에러메세지 처리
            const error = new Error('NOT_CHANGED_FEED_SYMBOL');
            error.status = 400;
            throw error;
          }
        }
      );
    },

    async deleteFeedSymbol(feedSymbolId: number) {
      await this.delete(feedSymbolId);
    },
  });
