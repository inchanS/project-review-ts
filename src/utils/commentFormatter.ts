import { Comment } from '../entities/comment.entity';
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
      this.comment.is_private &&
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
