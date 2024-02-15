import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CommentDto } from '../entities/dto/comment.dto';
import { CommentRepository } from '../repositories/comment.repository';
import { FeedRepository } from '../repositories/feed.repository';
import { IsNull, Not } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CustomError } from '../utils/util';
import { DateUtils } from '../utils/dateUtils';
import { Feed } from '../entities/feed.entity';

export interface ExtendedComment
  extends Omit<
    Comment,
    'created_at' | 'updated_at' | 'deleted_at' | 'user' | 'children'
  > {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user: ExtendedUser;
  children?: ExtendedComment[];
}

interface ExtendedUser {
  id: number | null;
  nickname: string | null;
  email: string | null;
}

export class CommentFormatter {
  private readonly comment: Comment;
  private readonly userId: number;
  private readonly parentUserId?: number;

  constructor(comment: Comment, userId: number, parentUserId?: number) {
    this.comment = comment;
    this.userId = userId;
    this.parentUserId = parentUserId;
  }

  isPrivate = (): boolean => {
    return (
      this.comment.is_private === true &&
      this.comment.user.id !== this.userId &&
      (this.parentUserId
        ? this.parentUserId !== this.userId
        : this.comment.feed.user.id !== this.userId)
    );
  };

  isDeleted = (): boolean => this.comment.deleted_at !== null;

  formatUser = (): ExtendedUser => {
    let formattedUser: ExtendedUser = this.comment.user;
    if (this.isDeleted() || this.isPrivate()) {
      formattedUser = { id: null, nickname: null, email: null };

      return formattedUser;
    }

    return formattedUser;
  };

  formatChildren = (): ExtendedComment[] =>
    this.comment.children
      ? this.comment.children.map(child =>
          new CommentFormatter(
            child,
            this.userId,
            this.comment.user.id
          ).format()
        )
      : [];

  public format = (): ExtendedComment => {
    return {
      id: this.comment.id,
      parent: this.comment.parent,
      feed: this.comment.feed,
      is_private: this.comment.is_private,
      comment: this.isDeleted()
        ? '## DELETED_COMMENT ##'
        : this.isPrivate()
        ? '## PRIVATE_COMMENT ##'
        : this.comment.comment,
      user: this.formatUser(),
      created_at: DateUtils.formatDate(this.comment.created_at),
      updated_at: DateUtils.formatDate(this.comment.updated_at),
      deleted_at: this.comment.deleted_at
        ? DateUtils.formatDate(this.comment.deleted_at)
        : null,
    };
  };

  public formatWithChildren = (): ExtendedComment => {
    const basicFormat: ExtendedComment = this.format();
    return {
      ...basicFormat,
      children: this.formatChildren(),
    };
  };
}

export class CommentsService {
  private feedRepository: FeedRepository;
  private commentRepository: CommentRepository;

  constructor() {
    this.feedRepository = FeedRepository.getInstance();
    this.commentRepository = CommentRepository.getInstance();
  }

  // 무한 대댓글의 경우, 재귀적으로 호출되는 함수
  getCommentList = async (feedId: number, userId: number) => {
    const feed: Feed | null = await this.feedRepository.findOne({
      loadRelationIds: true,
      where: { id: feedId },
    });

    // TODO 어떤 쿼리가 더 성능이 좋을까??
    // if (!feed || feed.posted_at === null) {
    const statusId: number = Number(feed?.status);
    if (!feed || statusId === 2) {
      throw new CustomError(404, 'FEED_NOT_FOUND');
    }

    const result = await this.commentRepository.getCommentList(feedId);

    // 덧글이 없을 경우 빈 배열 반환
    if (result.length === 0) {
      return [];
    }

    return [...result].map((comment: any) =>
      new CommentFormatter(comment, userId).formatWithChildren()
    );
  };

  createComment = async (commentInfo: CommentDto): Promise<void> => {
    commentInfo = plainToInstance(CommentDto, commentInfo);
    await validateOrReject(commentInfo).catch(errors => {
      throw { status: 500, message: errors[0].constraints };
    });

    // 임시게시글, 삭제된 게시글, 존재하지 않는 게시글에 댓글 달기 시도시 에러처리
    await this.feedRepository
      .findOneOrFail({
        where: {
          id: commentInfo.feed,
          posted_at: Not(IsNull()),
        },
      })
      .catch(() => {
        throw new CustomError(404, "COMMENT'S_FEED_VALIDATION_ERROR");
      });

    if (commentInfo.parent) {
      // 대댓글의 경우 부모댓글이 없을 때 에러 반환
      const parentComment = await this.commentRepository
        .findOneOrFail({
          loadRelationIds: true,
          where: { id: commentInfo.parent },
        })
        .catch(() => {
          throw new CustomError(404, 'COMMENT_PARENT_NOT_FOUND');
        });

      // 부모 댓글의 feedId와 body의 feedId가 다를 경우 에러 반환
      if (Number(parentComment.feed) !== commentInfo.feed) {
        throw new CustomError(400, 'COMMENT_PARENT_VALIDATION_ERROR');
      }
    }

    const newComment = plainToInstance(Comment, commentInfo);

    await this.commentRepository.createComment(newComment);
  };

  // 수정 또는 삭제시 해당 댓글의 유효성 검사 및 권한 검사를 위한 함수
  validateComment = async (userId: number, commentId: number) => {
    const result = await this.commentRepository.findOne({
      loadRelationIds: true,
      where: { id: commentId },
    });

    if (!result) {
      throw new CustomError(404, `ID_${commentId}_COMMENT_DOES_NOT_EXIST`);
    }

    // 작성자 아이디가 다를 때 에러처리
    if (userId !== Number(result.user)) {
      throw new CustomError(401, `ONLY_THE_AUTHOR_CAN_EDIT`);
    }

    return result;
  };

  updateComment = async (
    userId: number,
    commentId: number,
    commentInfo: CommentDto
  ): Promise<void> => {
    const originComment = await this.validateComment(userId, commentId);

    // commentInfo에서 내용 생략시, 원문 내용으로 채우기
    if (commentInfo.is_private === undefined) {
      commentInfo.is_private = originComment.is_private;
    }
    if (commentInfo.comment === undefined) {
      commentInfo.comment = originComment.comment;
    }

    // 변경사항이 없을 때 에러반환
    if (
      commentInfo.comment === originComment.comment &&
      commentInfo.is_private === originComment.is_private
    ) {
      throw new CustomError(405, `COMMENT_IS_NOT_CHANGED`);
    }

    await this.commentRepository.updateComment(commentId, commentInfo);
  };

  deleteComment = async (commentId: number, userId: number) => {
    // 원댓글 유효성 검사
    await this.validateComment(userId, commentId);

    await this.commentRepository.softDelete(commentId);
  };
}
