import dataSource from './index.db';
import { User } from '../entities/users.entity';
import { Feed } from '../entities/feed.entity';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import { CommentList } from '../entities/viewEntities/viewCommentList.entity';
import { Comment } from '../entities/comment.entity';

const userRepository = dataSource.getRepository(User);
const feedRepository = dataSource.getRepository(Feed);
const feedListRepository = dataSource.getRepository(FeedList);
const commentListRepository = dataSource.getRepository(CommentList);
const commentRepository = dataSource.getRepository(Comment);

const commentTreeRepository = dataSource.getTreeRepository(Comment);

export {
  userRepository,
  feedRepository,
  feedListRepository,
  commentListRepository,
  commentRepository,
  commentTreeRepository,
};
