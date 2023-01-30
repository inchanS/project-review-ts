import dataSource from './index.db';
import { User } from '../entities/users.entity';
import { Feed } from '../entities/feed.entity';
import { FeedList } from '../entities/viewList.entity';

const userRepository = dataSource.getRepository(User);
const feedRepository = dataSource.getRepository(Feed);
const feedListRepository = dataSource.getRepository(FeedList);

export { userRepository, feedRepository, feedListRepository };
