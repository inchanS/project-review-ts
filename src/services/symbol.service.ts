import dataSource from '../repositories/data-source';
import { Symbol } from '../entities/symbol.entity';
import { FeedSymbol } from '../entities/feedSymbol.entity';
import { plainToInstance } from 'class-transformer';
import { FeedSymbolDto } from '../entities/dto/feedSymbol.dto';
import { validateOrReject } from 'class-validator';
import { FeedRepository } from '../repositories/feed.repository';
import { FeedSymbolRepository } from '../repositories/feedSymbol.repository';
import {
  AddAndUpdateSymbolToFeedResult,
  CheckSymbolResult,
} from '../types/feedSymbol';

export class SymbolService {
  private feedRepository: FeedRepository;
  private feedSymbolRepository: FeedSymbolRepository;

  constructor() {
    this.feedRepository = new FeedRepository();
    this.feedSymbolRepository = new FeedSymbolRepository();
  }
  async getSymbols() {
    return await dataSource.getRepository(Symbol).find({
      select: ['id', 'symbol'],
    });
  }

  // 게시글당 사용자별 공감표시의 개수 가져오기
  async getFeedSymbolCount(feedId: number) {
    // 피드 유효성검사
    await this.feedRepository.getFeed(feedId).catch(() => {
      const error = new Error('INVALID_FEED');
      error.status = 404;
      throw error;
    });

    const result = await this.feedRepository.getFeedSymbolCount(feedId);

    return result.map((item: any) => ({
      ...item,
      count: Number(item.count),
    }));
  }

  async checkUsersSymbolForFeed(
    feedId: number,
    userId: number
  ): Promise<CheckSymbolResult> {
    const result = await this.feedSymbolRepository.getFeedSymbol(
      feedId,
      userId
    );

    let newResult: CheckSymbolResult = {
      checkValue: false,
      result: null,
    };

    if (!result) {
      return newResult;
    }

    if (result) {
      newResult.checkValue = true;
      newResult.result = result;
      return newResult;
    }
  }

  async addAndUpdateSymbolToFeed(
    feedSymbolInfo: FeedSymbolDto
  ): Promise<AddAndUpdateSymbolToFeedResult> {
    await validateOrReject(feedSymbolInfo).catch(errors => {
      throw { status: 500, message: errors[0].constraints };
    });

    // 피드 유효성검사
    const validateFeed = await this.feedRepository
      .getFeed(feedSymbolInfo.feed)
      .catch(() => {
        throw { status: 404, message: 'INVALID_FEED' };
      });

    // 사용자 유효성검사 (게시글 작성자는 공감할 수 없음)
    if (validateFeed.user.id === feedSymbolInfo.user) {
      throw { status: 403, message: 'THE_AUTHOR_OF_THE_POST_CANNOT_EMPATHIZE' };
    }

    // 심볼 유효성검사
    await dataSource
      .getRepository(Symbol)
      .findOneOrFail({
        where: { id: feedSymbolInfo.symbol },
      })
      .catch(() => {
        throw { status: 404, message: 'INVALID_SYMBOL' };
      });

    // 피드 심볼 중복검사
    const checkFeedSymbol = await this.feedSymbolRepository.getFeedSymbol(
      feedSymbolInfo.feed,
      feedSymbolInfo.user
    );

    // create와 update에 따른 sort 값 조정으로 controller에서 res.statusCode를 조정한다.
    let sort: AddAndUpdateSymbolToFeedResult['sort'] = 'add';
    // 이미 공감했을 경우, 공감 종류 변경으로 수정 반영
    if (checkFeedSymbol) {
      sort = 'update';
    }

    const newFeedSymbol = plainToInstance(FeedSymbol, feedSymbolInfo);

    await this.feedSymbolRepository.upsertFeedSymbol(newFeedSymbol);

    const result = await this.getFeedSymbolCount(feedSymbolInfo.feed);

    return { sort, result };
  }

  async removeSymbolFromFeed(userId: number, feedId: number) {
    // 피드 심볼 유효성검사
    const validateFeedSymbol = await this.feedSymbolRepository.getFeedSymbol(
      feedId,
      userId
    );

    if (!validateFeedSymbol) {
      const error = new Error(`FEED_SYMBOL_NOT_FOUND`);
      error.status = 404;
      throw error;
    }

    await this.feedSymbolRepository.deleteFeedSymbol(validateFeedSymbol.id);

    const message = `SYMBOL_REMOVED_FROM_${feedId}_FEED`;
    const result = await this.getFeedSymbolCount(feedId);
    return { message, result };
  }
}
