import { Feed } from '../../entities/feed.entity';
import { User } from '../../entities/users.entity';
import { Estimation } from '../../entities/estimation.entity';
import { Category } from '../../entities/category.entity';
import { FeedStatus } from '../../entities/feedStatus.entity';
import { Comment } from '../../entities/comment.entity';
import { FeedSymbol } from '../../entities/feedSymbol.entity';
import { Symbol } from '../../entities/symbol.entity';

export class MakeTestClass {
  private readonly id: number;
  private readonly userId: number;
  constructor(id: number, userId: number) {
    this.id = id;
    this.userId = userId;
  }

  // 테스트간 피드생성을 위한 피드 클래스 생성
  public feedData = (): Feed => {
    const testFeed: Feed = new Feed(
      this.userId as unknown as User,
      'test title',
      'test content',
      0,
      '1' as unknown as Estimation,
      '1' as unknown as Category,
      '1' as unknown as FeedStatus
    );
    testFeed.id = this.id;
    testFeed.posted_at = new Date();

    return testFeed;
  };

  // 테스트간 댓글생성을 위한 댓글 클래스 생성
  public static publicComment: string = 'test comment';
  public static deletedComment: string = '## DELETED_COMMENT ##';
  public static privateComment: string = '## PRIVATE_COMMENT ##';
  public commentData = (
    feedId: number,
    is_private: boolean,
    parent?: number,
    deleted?: boolean
  ): Comment => {
    const testComment: Comment = new Comment(
      this.userId as unknown as User,
      feedId as unknown as Feed,
      MakeTestClass.publicComment,
      is_private
    );
    testComment.id = this.id;
    testComment.parent = parent as unknown as Comment;
    testComment.deleted_at = deleted ? new Date() : null;

    return testComment;
  };

  // 테스트간 게시물공감 데이터 생성을 위한 클래스 생성
  public feedSymbolData = (feedId: number): FeedSymbol => {
    return new FeedSymbol(
      this.userId as unknown as User,
      feedId as unknown as Feed,
      1 as unknown as Symbol
    );
  };
}
