import dataSource from './index.db';
import { Comment } from '../entities/comment.entity';
import { CommentDto } from '../entities/dto/comment.dto';

export const CommentRepository = dataSource.getRepository(Comment).extend({
  async getCommentList(id: number) {
    return await this.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.children', 'children')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.feed', 'feed')
      .where('comment.feed = :id', { id })
      .orderBy('children.id', 'ASC')
      .getMany();
  },

  async createComment(commentInfo: CommentDto) {
    const newComment = await this.create(commentInfo);
    await this.save(newComment);
  },

  async getCommentListByUserId(userId: number) {
    return await this.find({
      loadRelationIds: true,
      where: { user: { id: userId } },
    });
  },
});

export const CommentTreeRepository = dataSource
  .getTreeRepository(Comment)
  .extend({
    async getCommentList(id: number) {
      return await this.createQueryBuilder('comment')
        .leftJoinAndSelect('comment.children', 'children')
        // .leftJoinAndSelect('comment.user', 'user')
        // .leftJoinAndSelect('comment.feed', 'feed')
        .where('comment.feed = :id', { id })
        .orderBy('children.id', 'ASC')
        .getMany();
    },
  });
