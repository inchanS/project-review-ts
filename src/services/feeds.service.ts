import { Feed } from '../entities/feed.entity';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import {
  FeedListRepository,
  FeedRepository,
} from '../repositories/feed.repository';

const createFeed = async (feedInfo: Feed): Promise<void> => {
  feedInfo = plainToInstance(Feed, feedInfo);
  await validateOrReject(feedInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  await FeedRepository.createFeed(feedInfo);
};

const getFeedList = async (page: number): Promise<FeedList[]> => {
  const limit: number = 10;
  if (!page) {
    page = 1;
  }
  const startIndex: number = (page - 1) * limit;
  return await FeedListRepository.getFeedList(startIndex, limit);
};

export default { createFeed, getFeedList };
