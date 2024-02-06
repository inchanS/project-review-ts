import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CommentDto } from '../entities/dto/comment.dto';
import { CommentRepository } from '../repositories/comment.repository';
import { FeedRepository } from '../repositories/feed.repository';
import { IsNull, Not } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CustomError } from '../utils/util';
import { User } from '../entities/users.entity';
import { DateUtils } from '../utils/dateUtils';

export class CommentFormatter {
  private readonly comment: Comment;
  private readonly userId: number;
  private readonly feedUserId: number;
  private readonly parentUserId?: number;

  constructor(
    comment: Comment,
    userId: number,
    feedUserId: number,
    parentUserId?: number
  ) {
    this.comment = comment;
    this.userId = userId;
    this.feedUserId = feedUserId;
    this.parentUserId = parentUserId;
  }

  isPrivate(): boolean {
    return (
      this.comment.is_private === true &&
      this.comment.user.id !== this.userId &&
      (this.parentUserId
        ? this.parentUserId !== this.userId
        : this.feedUserId !== this.userId)
    );
  }

  isDeleted(): boolean {
    return this.comment.deleted_at !== null;
  }

  formatUser(): User {
    if (this.isDeleted() || this.isPrivate()) {
      return { id: null, nickname: null, email: null } as User;
    }
    return this.comment.user;
  }

  formatChildren(): Comment[] {
    return this.comment.children
      ? this.comment.children.map(child =>
          new CommentFormatter(
            child,
            this.userId,
            this.feedUserId,
            this.comment.user.id
          ).format()
        )
      : [];
  }

  public format(): Comment {
    return {
      ...this.comment,
      comment: this.isDeleted()
        ? '## DELETED_COMMENT ##'
        : this.isPrivate()
        ? '## PRIVATE_COMMENT ##'
        : this.comment.comment,
      user: this.formatUser(),
      created_at: DateUtils.formatDate(
        this.comment.created_at
      ) as unknown as Date,
      updated_at: DateUtils.formatDate(
        this.comment.updated_at
      ) as unknown as Date,
      deleted_at: this.comment.deleted_at
        ? (DateUtils.formatDate(this.comment.deleted_at) as unknown as Date)
        : null,
      children: this.formatChildren(),
    };
  }
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
    const feed = await this.feedRepository.findOne({
      where: { id: feedId },
    });
    // FIXME 임시게시글의 덧글 목록은 가져오지 않게하고 에러핸들링하기!!
    if (!feed) throw new CustomError(404, 'FEED_NOT_FOUND');

    const result = await this.commentRepository.getCommentList(feedId);

    // 덧글이 없을 경우 빈 배열 반환
    if (result.length === 0) {
      return [];
    }

    const feedUserId = result[0].feed.user.id;
    return [...result].map((comment: any) =>
      new CommentFormatter(comment, userId, feedUserId).format()
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
      .catch(err => {
        throw new CustomError(404, "COMMENT'S_FEED_VALIDATION_ERROR");
      });

    if (commentInfo.parent) {
      // 대댓글의 경우 부모댓글이 없을 때 에러 반환
      const parentComment = await this.commentRepository
        .findOneOrFail({
          loadRelationIds: true,
          where: { id: commentInfo.parent },
        })
        .catch(err => {
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

  // TODO 이 함수 왜 안쓰고 있지??
  getCommentsById = async (userId: number) =>
    await this.commentRepository.getCommentListByUserId(userId, undefined);
}
