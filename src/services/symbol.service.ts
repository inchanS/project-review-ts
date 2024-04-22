import dataSource from '../repositories/data-source';
import { Symbol } from '../entities/symbol.entity';
import { FeedSymbol } from '../entities/feedSymbol.entity';
import { plainToInstance } from 'class-transformer';
import { FeedSymbolDto } from '../entities/dto/feedSymbol.dto';
import { validateOrReject } from 'class-validator';
import { FeedCustomRepository } from '../repositories/feed.customRepository';
import { FeedSymbolCustomRepository } from '../repositories/feedSymbol.customRepository';
import {
  AddAndUpdateSymbolToFeedResult,
  CheckSymbolResult,
  RemoveSymbolToFeedResult,
} from '../types/feedSymbol';
import { CustomError } from '../utils/util';
import { Feed } from '../entities/feed.entity';
import { EntityNotFoundError } from 'typeorm';

export class SymbolService {
  constructor(
    private feedCustomRepository: FeedCustomRepository,
    private feedSymbolCustomRepository: FeedSymbolCustomRepository
  ) {
    this.feedCustomRepository = feedCustomRepository;
    this.feedSymbolCustomRepository = feedSymbolCustomRepository;
  }
  public getSymbols = async (): Promise<Symbol[]> =>
    await dataSource.getRepository(Symbol).find({
      select: ['id', 'symbol'],
    });

  // 게시글당 사용자별 공감표시의 개수 가져오기
  public getFeedSymbolCount = async (
    feedId: number
  ): Promise<FeedSymbolCount[]> => {
    // 피드 유효성검사
    await this.validateFeedExistence(feedId);

    const result: FeedSymbolCount[] =
      await this.feedCustomRepository.getFeedSymbolCount(feedId);

    return result.map(
      (item: FeedSymbolCount): FeedSymbolCount => ({
        ...item,
        count: Number(item.count),
      })
    );
  };

  public checkUsersSymbolForFeed = async (
    feedId: number,
    userId: number
  ): Promise<CheckSymbolResult> => {
    const result: FeedSymbol | null =
      await this.feedSymbolCustomRepository.getFeedSymbol(feedId, userId);

    return {
      checkValue: !!result,
      result: result,
    };
  };

  public addAndUpdateSymbolToFeed = async (
    feedSymbolInfo: FeedSymbolDto
  ): Promise<AddAndUpdateSymbolToFeedResult> => {
    await validateOrReject(feedSymbolInfo).catch(errors => {
      throw new CustomError(500, errors[0].constraints);
    });

    // 피드 유효성검사
    const feed: Feed | void = await this.validateFeedExistence(
      feedSymbolInfo.feed
    );

    // 심볼 유효성검사
    await this.validateSymbolExistence(feedSymbolInfo.symbol);

    // 사용자 유효성검사 (게시글 작성자는 공감할 수 없음)
    this.ensureNotAuthor(feed, feedSymbolInfo.user);

    // 피드 심볼 중복검사
    const isNewSymbolAdded: boolean = await this.ensureFeedSymbolUpserted(
      feedSymbolInfo
    );

    // 응답메시지 생성
    const responseMessage: { message: string; statusCode: number } =
      this.createResponseMessage(isNewSymbolAdded, feedSymbolInfo);

    return {
      statusCode: responseMessage.statusCode,
      message: responseMessage.message,
      result: await this.getFeedSymbolCount(feedSymbolInfo.feed),
    };
  };

  public removeSymbolFromFeed = async (
    userId: number,
    feedId: number
  ): Promise<RemoveSymbolToFeedResult> => {
    const feedSymbol: FeedSymbol = await this.ensureFeedSymbolExists(
      feedId,
      userId
    );

    await this.feedSymbolCustomRepository.deleteFeedSymbol(feedSymbol.id);

    const message: string = `SYMBOL_REMOVED_FROM_${feedId}_FEED`;
    const result: FeedSymbolCount[] = await this.getFeedSymbolCount(feedId);
    return { message, result };
  };

  private async validateFeedExistence(feedId: number): Promise<Feed> {
    return await this.feedCustomRepository
      .getFeed(feedId)
      .catch((err: Error) => {
        if (err instanceof EntityNotFoundError) {
          throw new CustomError(404, `NOT_FOUND_FEED`);
        } else {
          throw new CustomError(500, `${err.message}`);
        }
      });
  }

  private async validateSymbolExistence(symbolId: number): Promise<Symbol> {
    const symbol: Symbol | null = await dataSource
      .getRepository(Symbol)
      .findOne({ where: { id: symbolId } });
    if (!symbol) {
      throw new CustomError(404, 'INVALID_SYMBOL');
    }
    return symbol;
  }

  private async upsertFeedSymbol(feedSymbolInfo: FeedSymbolDto): Promise<void> {
    const newFeedSymbol: FeedSymbol = plainToInstance(
      FeedSymbol,
      feedSymbolInfo
    );

    await this.feedSymbolCustomRepository.upsertFeedSymbol(newFeedSymbol);
  }

  private createResponseMessage(
    isNewSymbol: boolean,
    feedSymbolInfo: FeedSymbolDto
  ): { message: string; statusCode: number } {
    const action: 'ADDED' | 'UPDATED' = isNewSymbol ? 'ADDED' : 'UPDATED';
    const statusCode: 201 | 200 = isNewSymbol ? 201 : 200;
    const message: string = `SYMBOL_ID_${feedSymbolInfo.symbol}_HAS_BEEN_${action}_TO_THE_FEED_ID_${feedSymbolInfo.feed}`;

    return { statusCode, message };
  }

  private ensureNotAuthor(feed: Feed, userId: number): void {
    if (feed.user.id === userId) {
      throw new CustomError(403, 'THE_AUTHOR_OF_THE_POST_CANNOT_EMPATHIZE');
    }
  }

  private async ensureFeedSymbolUpserted(
    feedSymbolInfo: FeedSymbolDto
  ): Promise<boolean> {
    const existingSymbol: FeedSymbol | null =
      await this.feedSymbolCustomRepository.getFeedSymbol(
        feedSymbolInfo.feed,
        feedSymbolInfo.user
      );
    await this.upsertFeedSymbol(feedSymbolInfo);
    return !existingSymbol;
  }

  private async ensureFeedSymbolExists(
    feedId: number,
    userId: number
  ): Promise<FeedSymbol> {
    const feedSymbol: FeedSymbol | null =
      await this.feedSymbolCustomRepository.getFeedSymbol(feedId, userId);
    if (!feedSymbol) {
      throw new CustomError(404, `FEED_SYMBOL_NOT_FOUND`);
    }
    return feedSymbol;
  }
}
