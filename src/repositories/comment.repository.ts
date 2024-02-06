import dataSource from './data-source';
import { Comment } from '../entities/comment.entity';
import { CommentDto } from '../entities/dto/comment.dto';
import { Repository } from 'typeorm';
import { Pagination } from './feedList.repository';

export class CommentRepository extends Repository<Comment> {
  private static instance: CommentRepository;
  private constructor() {
    super(Comment, dataSource.createEntityManager());
  }
  public static getInstance(): CommentRepository {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  async getCommentList(id: number): Promise<Comment[]> {
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
  }

  async createComment(commentInfo: Comment): Promise<void> {
    const newComment = this.create(commentInfo);
    await this.save(newComment);
  }

  async updateComment(
    commentId: number,
    commentInfo: CommentDto
  ): Promise<void> {
    await dataSource.manager.update(Comment, commentId, {
      comment: commentInfo.comment,
      is_private: commentInfo.is_private,
    });
  }

  async getCommentCountByUserId(userId: number): Promise<number> {
    return await this.count({
      where: { user: { id: userId } },
      withDeleted: true,
    });

    // return await this.createQueryBuilder('comment')
    //   .select(['COUNT(comment.id) as commentCnt', 'comment.user'])
    //   .where('comment.user = :userId', { userId: userId })
    //   .withDeleted()
    //   .getRawOne();
  }

  async getCommentListByUserId(
    userId: number,
    page: Pagination
  ): Promise<Comment[]> {
    let pageCondition: {
      skip: number;
      take: number;
    };

    if (page) {
      pageCondition = {
        skip: page.startIndex,
        take: page.limit,
      };
    }

    // version 1 (단순 조회용 : typeORM의 find Option에서는 관계테이블의 세부 내역만을 특정하여 추릴 수 없다.)
    // return await this.find({
    //   withDeleted: true,
    //   loadRelationIds: true,
    //   where: { user: { id: userId } },
    //   order: { created_at: 'DESC' },
    //   ...pageCondition,
    // });

    // version 2 (로그인한 사용자와의 관계로 비공개 덧글 내용을 조회하기 위한 로직 : 관계 테이블의 세부 정보를 조회하기 위해 queryBuilder를 이용한 join 사용)
    return await this.createQueryBuilder('comment')
      .withDeleted()
      .addSelect('user.id')
      .addSelect(['feed.id', 'feedUser.id'])
      .addSelect(['parent.id', 'parentUser.id'])
      .leftJoin('comment.user', 'user')
      .leftJoin('comment.feed', 'feed')
      .leftJoin('feed.user', 'feedUser')
      .leftJoin('comment.parent', 'parent')
      .leftJoin('parent.user', 'parentUser')
      .where('comment.user = :id', { userId })
      .orderBy('comment.id', 'DESC')
      .setParameter('id', userId)
      .skip(pageCondition?.skip)
      .take(pageCondition?.take)
      .getMany();

    // version 3 : version 2에서 응답값을 다중객체가 아닌 하나의 객체로 응답받기 위해 getRawMany() 사용
    // return await this.createQueryBuilder('comment')
    //   .withDeleted()
    //   .select('comment.id', 'id')
    //   .addSelect('comment.created_at', 'created_at')
    //   .addSelect('comment.updated_at', 'updated_at')
    //   .addSelect('comment.deleted_at', 'deleted_at')
    //   .addSelect('user.id', 'userId')
    //   .addSelect('feed.id', 'feedId')
    //   .addSelect('feedUser.id', 'feedUserId')
    //   .addSelect('comment.comment', 'comment')
    //   .addSelect('comment.is_private', 'is_private')
    //   .addSelect('parent.id', 'parentId')
    //   .addSelect('parentUser.id', 'parentUserId')
    //   .leftJoin('comment.user', 'user')
    //   .leftJoin('comment.feed', 'feed')
    //   .leftJoin('feed.user', 'feedUser')
    //   .leftJoin('comment.parent', 'parent')
    //   .leftJoin('parent.user', 'parentUser')
    //   .where('comment.user = :id', { userId })
    //   .orderBy('comment.id', 'DESC')
    //   .setParameter('id', userId)
    //   .skip(pageCondition.skip)
    //   .take(pageCondition.take)
    //   .getRawMany();
  }
}
