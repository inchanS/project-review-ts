import { DataSource, ViewColumn, ViewEntity } from 'typeorm';
import { Feed } from './feed.entity';
import { User } from './users.entity';

@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('f.id', 'id')
      .addSelect('f.title', 'title')
      .addSelect('f.content', 'content')
      .addSelect('u.nickname', 'nickname')
      .from(Feed, 'f')
      .leftJoin(User, 'u', 'userId = u.id'),
})
export class FeedList {
  @ViewColumn()
  id: number;

  @ViewColumn()
  title: string;

  @ViewColumn()
  content: string;

  @ViewColumn()
  nickname: string;
}
