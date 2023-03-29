import dataSource from './index.db';
import { Comment } from '../entities/comment.entity';
import { CommentDto } from '../entities/dto/comment.dto';

export const CommentRepository = dataSource.getRepository(Comment).extend({
  async getCommentList(id: number) {
    return await this.createQueryBuilder('comment')
      .withDeleted()
      .addSelect(['user.id', 'user.nickname', 'user.email'])
      .addSelect(['feed.id', 'feed.title', 'feedUser'])
      .addSelect([
        'childrenUser.id',
        'childrenUser.nickname',
        'childrenUser.email',
      ])
      .addSelect([
        'childrenUser2.id',
        'childrenUser2.nickname',
        'childrenUser2.email',
      ])
      .leftJoin('comment.user', 'user')
      .leftJoin('comment.feed', 'feed')
      .leftJoin('feed.user', 'feedUser')
      .leftJoinAndSelect('comment.children', 'children')
      .leftJoin('children.user', 'childrenUser')
      .leftJoinAndSelect('children.children', 'children2')
      .leftJoin('children2.user', 'childrenUser2')
      .where('comment.feed = :id', { id })
      .andWhere('comment.parentId IS NULL')
      .orderBy('comment.id', 'ASC')
      .addOrderBy('children.id', 'ASC')
      .setParameter('id', id)
      .getMany();
  },

  async createComment(commentInfo: CommentDto) {
    const newComment = await this.create(commentInfo);
    await this.save(newComment);
  },

  async updateComment(commentId: number, commentInfo: CommentDto) {
    await dataSource.manager.update(Comment, commentId, {
      comment: commentInfo.comment,
      is_private: commentInfo.is_private,
    });
  },

  async getCommentListByUserId(userId: number) {
    return await this.find({
      withDeleted: true,
      loadRelationIds: true,
      where: { user: { id: userId } },
    });
  },
});
