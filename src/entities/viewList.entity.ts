import { DataSource, ViewEntity } from 'typeorm';
import { Feed } from './feed.entity';
import { User } from './users.entity';

@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('feed.id', 'id')
      .select('feed.title', 'title')
      .select('feed.content', 'content')
      .select('feed.userId', 'userId')
      .select('user.nickname', 'nickname')
      .from(Feed, 'feed')
      .leftJoin(User, 'user', 'user.id = feed.userId'),
})
export class FeedList {}
