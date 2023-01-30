import { Feed } from '../entities/feed.entity';
import { feedRepository } from './repositories';

const createFeed = async (feedInfo: Feed): Promise<void> => {
  const feed = await feedRepository.create(feedInfo);
  await feedRepository.save(feed);
};

export default { createFeed };
