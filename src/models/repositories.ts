import dataSource from './index.dao';
import { User } from '../entities/users.entity';
import { Feed } from '../entities/feed.entity';

const userRepository = dataSource.getRepository(User);
const feedRepository = dataSource.getRepository(Feed);

export { userRepository, feedRepository };
