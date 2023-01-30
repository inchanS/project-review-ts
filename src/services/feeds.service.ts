import { Feed } from '../entities/feed.entity';
import feedsDao from '../models/feeds.dao';
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';

const createFeed = async (feedInfo: Feed): Promise<void> => {
  feedInfo = plainToClass(Feed, feedInfo);
  await validateOrReject(feedInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  await feedsDao.createFeed(feedInfo);
};

export default { createFeed };
