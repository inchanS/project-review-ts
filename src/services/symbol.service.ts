import dataSource from '../repositories/index.db';
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

// TODO statuscode 401 중 403으로 변경할거 다 찾아서 변경하고,
//  api 문서에도 반영, README.md에도 반영

const getSymbols = async () => {
  return await dataSource.getRepository(Symbol).find({
    select: ['id', 'symbol'],
  });
};

// 게시글당 사용자별 공감표시의 개수 가져오기
const getFeedSymbolCount = async (feedId: number) => {
  // 피드 유효성검사
  await FeedRepository.getFeed(feedId).catch(() => {
    throw new Error('INVALID_FEED');
  });

  const result = await FeedRepository.getFeedSymbolCount(feedId);

  return result.map((item: any) => ({
    ...item,
    count: Number(item.count),
  }));
};

const checkUsersSymbolForfeed = async (
  feedId: number,
  userId: number
): Promise<CheckSymbolResult> => {
  const result = await FeedSymbolRepository.getFeedSymbol(feedId, userId);

  let newResult: CheckSymbolResult = {
    checkValue: false,
    result: null,
  };

  if (!result) {
    return newResult;
  }

  if (result) {
    (newResult.checkValue = true), (newResult.result = result);
    return newResult;
  }
};

const addAndUpdateSymbolToFeed = async (
  feedSymbolInfo: FeedSymbolDto
): Promise<AddAndUpdateSymbolToFeedResult> => {
  await validateOrReject(feedSymbolInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  // 피드 유효성검사
  const validateFeed = await FeedRepository.getFeed(feedSymbolInfo.feed).catch(
    () => {
      throw new Error('INVALID_FEED');
    }
  );

  // 사용자 유효성검사 (게시글 작성자는 공감할 수 없음)
  if (validateFeed.user.id === feedSymbolInfo.user) {
    throw new Error('THE_AUTHOR_OF_THE_POST_CANNOT_EMPATHIZE');
  }

  // 심볼 유효성검사
  await dataSource
    .getRepository(Symbol)
    .findOneOrFail({
      where: { id: feedSymbolInfo.symbol },
    })
    .catch(() => {
      throw new Error('INVALID_SYMBOL');
    });

  // 피드 심볼 중복검사
  const checkFeedSymbol = await FeedSymbolRepository.getFeedSymbol(
    feedSymbolInfo.feed,
    feedSymbolInfo.user
  );

  // 이미 공감했을 경우, 공감 종류 변경으로 수정 반영
  if (checkFeedSymbol) {
    if (Number(checkFeedSymbol.symbol) === feedSymbolInfo.symbol) {
      throw new Error('NOT_CHANGED');
    }

    if (Number(checkFeedSymbol.symbol) !== feedSymbolInfo.symbol) {
      await FeedSymbolRepository.updateFeedSymbol(
        checkFeedSymbol.id,
        feedSymbolInfo.symbol
      );

      const sort: AddAndUpdateSymbolToFeedResult['sort'] = 'update';
      const result = await getFeedSymbolCount(feedSymbolInfo.feed);
      return { sort, result };
    }
  }

  // 게시글별 조회자의 공감표시를 DB에 저장
  const newFeedSymbol = plainToInstance(FeedSymbol, feedSymbolInfo);

  await FeedSymbolRepository.addFeedSymbol(newFeedSymbol).catch(
    (err: Error) => {
      if (err.message.includes('ER_DUP_ENTRY')) {
        throw new Error('DUPLICATE_FEED_SYMBOL');
      }
      throw new Error(err.message);
    }
  );

  const sort: AddAndUpdateSymbolToFeedResult['sort'] = 'add';
  const result = await getFeedSymbolCount(feedSymbolInfo.feed);
  return { sort, result };
};

const removeSymbolFromFeed = async (userId: number, feedId: number) => {
  // 피드 심볼 유효성검사
  const validateFeedSymbol = await FeedSymbolRepository.getFeedSymbol(
    feedId,
    userId
  );

  if (!validateFeedSymbol) {
    throw new Error(`FEED_SYMBOL_NOT_FOUND`);
  }

  await FeedSymbolRepository.deleteFeedSymbol(validateFeedSymbol.id);

  const message = `SYMBOL_REMOVED_FROM_${feedId}_FEED`;
  const result = await getFeedSymbolCount(feedId);
  return { message, result };
};
export default {
  getSymbols,
  getFeedSymbolCount,
  addAndUpdateSymbolToFeed,
  removeSymbolFromFeed,
  checkUsersSymbolForfeed,
};
