import { FeedSymbol } from '../entities/feedSymbol.entity';
import dataSource from './index.db';

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

    async addFeedSymbol(feedSymbolInfo: FeedSymbol) {
      const feedSymbol = await this.create(feedSymbolInfo);
      await this.save(feedSymbol);
    },

    async updateFeedSymbol(feedSymbolId: number, symbolId: number) {
      await this.update(feedSymbolId, { symbol: { id: symbolId } });
    },

    async deleteFeedSymbol(feedSymbolId: number) {
      await this.delete(feedSymbolId);
    },
  });
