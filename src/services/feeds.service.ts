import { Feed } from '../entities/feed.entity';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import {
  FeedListRepository,
  FeedRepository,
} from '../repositories/feed.repository';

// TODO : 피드 생성 시, 이미지 업로드 기능 추가
const createFeed = async (feedInfo: Feed): Promise<void> => {
  feedInfo = plainToInstance(Feed, feedInfo);
  await validateOrReject(feedInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  await FeedRepository.createFeed(feedInfo);
};

const getFeedList = async (
  categoryId: number,
  page: number
): Promise<FeedList[]> => {
  console.log('🔥feeds.service/getFeedList:24- categoryId = ', categoryId);
  if (!categoryId) {
    categoryId = undefined;
  }
  console.log('🔥feeds.service/getFeedList:28-  = ', categoryId);
  const limit: number = 10;
  if (!page) {
    page = 1;
  }
  const startIndex: number = (page - 1) * limit;
  return await FeedListRepository.getFeedList(categoryId, startIndex, limit);
};

export default { createFeed, getFeedList };
