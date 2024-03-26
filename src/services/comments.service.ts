import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CommentDto } from '../entities/dto/comment.dto';
import { CommentRepository } from '../repositories/comment.repository';
import { FeedRepository } from '../repositories/feed.repository';
import { Comment } from '../entities/comment.entity';
import { CustomError } from '../utils/util';
import { ExtendedUser } from '../types/comment';

export class CommentFormatter {
  private readonly comment: Comment;
  private readonly userId: number;
  private readonly parentUserId?: number;

  constructor(comment: Comment, userId: number, parentUserId?: number) {
    this.comment = comment;
    this.userId = userId;
    this.parentUserId = parentUserId;
  }

  public formatComments = (): Comment => {
    let result: Comment = this.comment;
    result.comment = this.isDeleted()
      ? '## DELETED_COMMENT ##'
      : this.isPrivate()
      ? '## PRIVATE_COMMENT ##'
      : this.comment.comment;

    result.user = this.formatUser();

    return result;
  };

  public formatWithChildren = (): Comment => {
    const result: Comment = this.formatComments();
    result.children = this.formatChildrenComments();

    return result;
  };

  private isPrivate = (): boolean => {
    return (
      this.comment.is_private === true &&
      this.comment.user.id !== this.userId &&
      (this.parentUserId
        ? this.parentUserId !== this.userId
        : this.comment.feed.user.id !== this.userId)
    );
  };

  private isDeleted = (): boolean => this.comment.deleted_at !== null;

  private formatUser = (): ExtendedUser => {
    let formattedUser: ExtendedUser = this.comment.user;
    if (this.isDeleted() || this.isPrivate()) {
      formattedUser = {
        ...formattedUser,
        id: null,
        nickname: null,
        email: null,
      };
      return formattedUser;
    }

    return formattedUser;
  };

  private formatChildrenComments = (): Comment[] => {
    let result: Comment[] = this.comment.children;

    if (result && result.length > 0) {
      result.map((child: Comment) => {
        const parentId =
          this.comment.user && this.comment.user.id !== null
            ? this.comment.user.id
            : undefined;

        return new CommentFormatter(
          child,
          this.userId,
          parentId
        ).formatWithChildren();
      });
      return result;
    }
    return [];
  };
}

export class CommentsService {
  private feedRepository: FeedRepository;
  private commentRepository: CommentRepository;

  constructor() {
    this.feedRepository = FeedRepository.getInstance();
    this.commentRepository = CommentRepository.getInstance();
  }

  public getCommentList = async (
    feedId: number,
    userId: number
  ): Promise<Comment[]> => {
    await this.feedRepository
      .findOneOrFail({
        loadRelationIds: true,
        where: { id: feedId, status: { id: 1 } },
      })
      .catch(() => {
        throw new CustomError(404, 'FEED_NOT_FOUND');
      });

    const result: Comment[] = await this.commentRepository.getCommentList(
      feedId
    );

    return result.map((comment: Comment) =>
      new CommentFormatter(comment, userId).formatWithChildren()
    );
  };

  public createComment = async (commentInfo: CommentDto): Promise<Comment> => {
    commentInfo = plainToInstance(CommentDto, commentInfo);
    await validateOrReject(commentInfo).catch(errors => {
      throw { status: 500, message: errors[0].constraints };
    });

    // 임시게시글, 삭제된 게시글, 존재하지 않는 게시글에 댓글 달기 시도시 에러처리
    await this.validateFeedExists(commentInfo);

    // 대댓글일 경우 부모댓글의 유효성 검사
    if (commentInfo.parent) {
      const parentCommentInfo: Comment = await this.validateParentCommentInfo(
        commentInfo
      );
      // 대댓글의 경우 depth 3 이상의 댓글 입력시 에러 반환
      await this.validateMaximumCommentDepth(parentCommentInfo);
    }

    const newComment: Comment = plainToInstance(Comment, commentInfo);

    return await this.commentRepository.createComment(newComment);
  };

  public updateComment = async (
    userId: number,
    commentId: number,
    commentInfo: CommentDto
  ): Promise<Comment> => {
    const originComment: Comment = await this.validateComment(
      userId,
      commentId
    );

    // commentInfo에서 내용 생략시, 원문 내용으로 채우기
    const updatedFields: { comment: string; is_private: boolean } = {
      comment: commentInfo.comment ?? originComment.comment,
      is_private: commentInfo.is_private ?? originComment.is_private,
    };

    // 변경사항이 없을 때 에러반환
    if (
      updatedFields.comment === originComment.comment &&
      updatedFields.is_private === originComment.is_private
    ) {
      throw new CustomError(405, `COMMENT_IS_NOT_CHANGED`);
    }

    return await this.commentRepository.updateComment(commentId, updatedFields);
  };

  public deleteComment = async (
    commentId: number,
    userId: number
  ): Promise<void> => {
    // 원댓글 유효성 검사
    await this.validateComment(userId, commentId);
    await this.commentRepository.softDelete(commentId);
  };

  // 수정 또는 삭제시 해당 댓글의 유효성 검사 및 권한 검사를 위한 함수
  private validateComment = async (
    userId: number,
    commentId: number
  ): Promise<Comment> => {
    const result: Comment | null = await this.commentRepository.findOne({
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

  private validateFeedExists = async (
    commentInfo: CommentDto
  ): Promise<void> => {
    await this.feedRepository
      .findOneOrFail({
        where: {
          id: commentInfo.feed,
          status: { is_status: 'published' },
        },
      })
      .catch(() => {
        throw new CustomError(404, "COMMENT'S_FEED_VALIDATION_ERROR");
      });
  };

  private validateParentCommentInfo = async (
    commentInfo: CommentDto
  ): Promise<Comment> => {
    // 대댓글의 경우 부모댓글이 없을 때 에러 반환
    const parentComment: Comment = await this.commentRepository
      .findOneOrFail({
        loadRelationIds: true,
        where: { id: commentInfo.parent },
        withDeleted: true,
      })
      .catch(() => {
        throw new CustomError(404, 'COMMENT_PARENT_NOT_FOUND');
      });

    // 부모 댓글의 feedId와 body의 feedId가 다를 경우 에러 반환
    if (Number(parentComment.feed) !== commentInfo.feed) {
      throw new CustomError(400, 'COMMENT_PARENT_VALIDATION_ERROR');
    }

    return parentComment;
  };

  private validateMaximumCommentDepth = async (parentComment: Comment) => {
    // depth 3이상의 댓글 생성을 막기 위한 에러 반환
    if (parentComment.parent) {
      const grandparentId: number = Number(parentComment.parent);
      const grandparentComment: Comment | null =
        await this.commentRepository.findOne({
          loadRelationIds: true,
          withDeleted: true,
          where: { id: grandparentId },
        });

      if (grandparentComment && grandparentComment.parent) {
        throw new CustomError(400, 'CANNOT_CREATE_A_COMMENT_BEYOND_DEPTH_2');
      }
    }
  };
}
