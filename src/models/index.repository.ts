import dataSource from './index.db';
import { User } from '../entities/users.entity';
import { Feed } from '../entities/feed.entity';
import { FeedList } from '../entities/viewFeedList.entity';
import { CommentList } from '../entities/viewCommentList.entity';

const userRepository = dataSource.getRepository(User);
const feedRepository = dataSource.getRepository(Feed);
const feedListRepository = dataSource.getRepository(FeedList);
const commentListRepository = dataSource.getRepository(CommentList);

export {
  userRepository,
  feedRepository,
  feedListRepository,
  commentListRepository,
};
