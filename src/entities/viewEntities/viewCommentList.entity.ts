import { DataSource, ViewColumn, ViewEntity } from 'typeorm';
import { User } from '../users.entity';
import { Comment } from '../comment.entity';

@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder(Comment, 'comment')
      .select('comment.id', 'id')
      .addSelect('comment.feedId', 'feedId')
      .addSelect('comment.userId', 'userId')
      .addSelect('user.nickname', 'nickname')
      .addSelect('comment.comment', 'comment')
      .addSelect('comment.is_private', 'isPrivate')
      .addSelect('comment.is_deleted', 'isDeleted')
      .addSelect('SUBSTRING(comment.created_at,1,16)', 'createdAt')
      .addSelect('SUBSTRING(comment.updated_at,1,16)', 'updatedAt')
      .leftJoinAndSelect('comment.children', 'children')
      .leftJoin(User, 'user', 'comment.userId = user.id'),
})
export class CommentList {
  @ViewColumn()
  id: number;

  @ViewColumn()
  feedId: number;

  @ViewColumn()
  userId: number;

  @ViewColumn()
  nickname: string;

  @ViewColumn()
  comment: string;

  @ViewColumn()
  isPrivate: boolean;

  @ViewColumn()
  isDeleted: boolean;

  @ViewColumn()
  createdAt: Date;

  @ViewColumn()
  updatedAt: Date;
}
