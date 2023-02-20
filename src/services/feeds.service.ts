import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import {
  FeedListRepository,
  FeedRepository,
} from '../repositories/feed.repository';
import { FeedDto } from '../entities/dto/feed.dto';
import { TempFeedDto } from '../entities/dto/tempFeed.dto';
import { Feed } from '../entities/feed.entity';

const createTempFeed = async (feedInfo: TempFeedDto): Promise<void> => {
  feedInfo = plainToInstance(TempFeedDto, feedInfo);
  await validateOrReject(feedInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });
  // FeedStatus id 2 is 'temporary'
  feedInfo.status = 2;

  let newTempFeed: Feed = plainToInstance(FeedDto, feedInfo);

  await FeedRepository.createFeed(newTempFeed);
};

const createFeed = async (feedInfo: FeedDto): Promise<void> => {
  feedInfo = plainToInstance(FeedDto, feedInfo);
  await validateOrReject(feedInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  await FeedRepository.createFeed(feedInfo);
};

const getFeedList = async (
  categoryId: number,
  page: number
): Promise<FeedList[]> => {
  if (!categoryId) {
    categoryId = undefined;
  }
  const limit: number = 10;
  if (!page) {
    page = 1;
  }
  const startIndex: number = (page - 1) * limit;
  return await FeedListRepository.getFeedList(categoryId, startIndex, limit);
};

export default { createFeed, getFeedList, createTempFeed };
