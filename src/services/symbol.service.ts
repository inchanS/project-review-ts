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
    const error = new Error('INVALID_FEED');
    error.status = 404;
    throw error;
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
      const error = new Error('INVALID_FEED');
      error.status = 404;
      throw error;
    }
  );

  // 사용자 유효성검사 (게시글 작성자는 공감할 수 없음)
  if (validateFeed.user.id === feedSymbolInfo.user) {
    const error = new Error('THE_AUTHOR_OF_THE_POST_CANNOT_EMPATHIZE');
    error.status = 403;
    throw error;
  }

  // 심볼 유효성검사
  await dataSource
    .getRepository(Symbol)
    .findOneOrFail({
      where: { id: feedSymbolInfo.symbol },
    })
    .catch(() => {
      const error = new Error('INVALID_SYMBOL');
      error.status = 404;
      throw error;
    });

  // 피드 심볼 중복검사
  const checkFeedSymbol = await FeedSymbolRepository.getFeedSymbol(
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

  await FeedSymbolRepository.upsertFeedSymbol(newFeedSymbol);

  // FIXME 삭제된 피드의 경우 500에러처리되는데 이걸 404로 바꿔야함
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
    const error = new Error(`FEED_SYMBOL_NOT_FOUND`);
    error.status = 404;
    throw error;
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
