import { Feed } from '../entities/feed.entity';
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { feedListRepository, feedRepository } from '../db/index.repository';

const createFeed = async (feedInfo: Feed): Promise<void> => {
  feedInfo = plainToClass(Feed, feedInfo);
  await validateOrReject(feedInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  const feed = await feedRepository.create(feedInfo);
  await feedRepository.save(feed);
};

const getFeedList = async (page: number) => {
  const limit: number = 10;
  if (!page) {
    page = 1;
  }

  const pageOffset: number = (page - 1) * limit;

  return await feedListRepository.find({
    order: {
      id: 'DESC',
    },
    skip: pageOffset,
    take: limit,
  });
};

export default { createFeed, getFeedList };
