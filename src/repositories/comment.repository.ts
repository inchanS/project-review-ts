import dataSource from './index.db';
import { Comment } from '../entities/comment.entity';
import { CommentDto } from '../entities/dto/comment.dto';

export const CommentRepository = dataSource.getRepository(Comment).extend({
  async getCommentList(id: number) {
    return await this.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.children', 'children')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.feed', 'feed')
      .leftJoinAndSelect('children.user', 'childrenUser')
      .leftJoinAndSelect('children.feed', 'childrenFeed')
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
      loadRelationIds: true,
      where: { user: { id: userId } },
    });
  },
});
