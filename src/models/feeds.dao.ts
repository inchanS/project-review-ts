import { Feed } from '../entities/feed.entity';
import { feedRepository } from './repositories';

const createFeed = async (feedInfo: Feed): Promise<void> => {
  const feed = await feedRepository.create(feedInfo);
  await feedRepository.save(feed);
};

const getFeedList = async (limit: number, pageOffset: number) => {
  console.log('dao pageOffset =', pageOffset);
  return await feedRepository.find({
    order: {
      id: 'DESC',
    },
    skip: pageOffset,
    take: limit,
  });
};

export default { createFeed, getFeedList };
