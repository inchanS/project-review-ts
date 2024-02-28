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
import { CustomError } from '../utils/util';
import { Feed } from '../entities/feed.entity';

export class SymbolService {
  private feedRepository: FeedRepository;
  private feedSymbolRepository: FeedSymbolRepository;

  constructor() {
    this.feedRepository = FeedRepository.getInstance();
    this.feedSymbolRepository = FeedSymbolRepository.getInstance();
  }
  getSymbols = async (): Promise<Symbol[]> =>
    await dataSource.getRepository(Symbol).find({
      select: ['id', 'symbol'],
    });

  // 게시글당 사용자별 공감표시의 개수 가져오기
  getFeedSymbolCount = async (feedId: number) => {
    // 피드 유효성검사
    await this.feedRepository.getFeed(feedId).catch(() => {
      throw new CustomError(404, 'INVALID_FEED');
    });

    const result: FeedSymbolCount[] =
      await this.feedRepository.getFeedSymbolCount(feedId);

    return result.map((item: any) => ({
      ...item,
      count: Number(item.count),
    }));
  };

  checkUsersSymbolForFeed = async (
    feedId: number,
    userId: number
  ): Promise<CheckSymbolResult> => {
    const result: FeedSymbol | null =
      await this.feedSymbolRepository.getFeedSymbol(feedId, userId);

    let newResult: CheckSymbolResult = {
      checkValue: false,
      result: null,
    };

    if (!result) {
      return newResult;
    } else {
      newResult.checkValue = true;
      newResult.result = result;
      return newResult;
    }
  };

  addAndUpdateSymbolToFeed = async (
    feedSymbolInfo: FeedSymbolDto
  ): Promise<AddAndUpdateSymbolToFeedResult> => {
    await validateOrReject(feedSymbolInfo).catch(errors => {
      throw new CustomError(500, errors[0].constraints);
    });

    // 피드 유효성검사
    const validateFeed: Feed | void = await this.feedRepository
      .getFeed(feedSymbolInfo.feed)
      .catch((): void => {
        throw new CustomError(404, 'INVALID_FEED');
      });

    // 사용자 유효성검사 (게시글 작성자는 공감할 수 없음)
    if (validateFeed && validateFeed.user.id === feedSymbolInfo.user) {
      throw new CustomError(403, 'THE_AUTHOR_OF_THE_POST_CANNOT_EMPATHIZE');
    }

    // 심볼 유효성검사
    await dataSource
      .getRepository(Symbol)
      .findOneOrFail({
        where: { id: feedSymbolInfo.symbol },
      })
      .catch((): void => {
        throw new CustomError(404, 'INVALID_SYMBOL');
      });

    // 피드 심볼 중복검사
    const checkFeedSymbol: FeedSymbol | null =
      await this.feedSymbolRepository.getFeedSymbol(
        feedSymbolInfo.feed,
        feedSymbolInfo.user
      );

    // create와 update에 따른 sort 값 조정으로 controller에서 res.statusCode를 조정한다.
    let sort: AddAndUpdateSymbolToFeedResult['sort'] = 'add';
    // 이미 공감했을 경우, 공감 종류 변경으로 수정 반영
    if (checkFeedSymbol) {
      sort = 'update';
    }

    const newFeedSymbol: FeedSymbol = plainToInstance(
      FeedSymbol,
      feedSymbolInfo
    );

    await this.feedSymbolRepository.upsertFeedSymbol(newFeedSymbol);

    const result = await this.getFeedSymbolCount(feedSymbolInfo.feed);

    return { sort, result };
  };

  removeSymbolFromFeed = async (userId: number, feedId: number) => {
    // 피드 심볼 유효성검사
    const validateFeedSymbol: FeedSymbol | null =
      await this.feedSymbolRepository.getFeedSymbol(feedId, userId);

    if (!validateFeedSymbol) {
      throw new CustomError(404, `FEED_SYMBOL_NOT_FOUND`);
    }

    await this.feedSymbolRepository.deleteFeedSymbol(validateFeedSymbol.id);

    const message: string = `SYMBOL_REMOVED_FROM_${feedId}_FEED`;
    const result = await this.getFeedSymbolCount(feedId);
    return { message, result };
  };
}
