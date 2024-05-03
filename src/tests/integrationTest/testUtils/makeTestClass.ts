import { Feed } from '../../../entities/feed.entity';
import { User } from '../../../entities/users.entity';
import { Estimation } from '../../../entities/estimation.entity';
import { Category } from '../../../entities/category.entity';
import { FeedStatus } from '../../../entities/feedStatus.entity';
import { Comment } from '../../../entities/comment.entity';
import { FeedSymbol } from '../../../entities/feedSymbol.entity';
import { Symbol } from '../../../entities/symbol.entity';
import { UploadFiles } from '../../../entities/uploadFiles.entity';
import { plainToInstance } from 'class-transformer';

export class MakeTestClass {
  private readonly userId: number;
  constructor(userId: number) {
    this.userId = userId;
  }

  // 테스트간 피드생성을 위한 피드 클래스 생성
  public feedData = (
    id: number,
    title: string = 'test title',
    content: string = 'test content'
  ): Feed => {
    const testFeed: Feed = new Feed(
      this.userId as unknown as User,
      title,
      content,
      0,
      1 as unknown as Estimation,
      1 as unknown as Category,
      1 as unknown as FeedStatus
    );
    testFeed.id = id;
    testFeed.created_at = new Date();
    testFeed.updated_at = new Date();
    testFeed.posted_at = new Date();

    return testFeed;
  };

  public generateMultipleFeeds = (
    numFiles: number,
    startIndexId: number = 1
  ): Feed[] => {
    const testFeeds: Feed[] = [];
    for (let i: number = startIndexId; i < startIndexId + numFiles; i++) {
      const content: string = `test content ${i}`;
      const testFeed: Feed = this.feedData(i, undefined, content);
      testFeeds.push(testFeed);
    }
    return testFeeds;
  };

  public tempFeedData = (
    id: number,
    title?: string,
    content: string = 'test content'
  ): Feed => {
    const testFeedInfo = {
      user: this.userId,
      title: title,
      content: content,
      status: 2,
    };
    const testFeed: Feed = plainToInstance(Feed, testFeedInfo);
    testFeed.id = id;

    return testFeed;
  };

  public generateMultipleTempFeeds = (
    numFiles: number,
    startIndexId: number = 1
  ): Feed[] => {
    const testFeeds: Feed[] = [];
    for (let i: number = startIndexId; i < startIndexId + numFiles; i++) {
      const content: string = `test content ${i}`;
      const testFeed: Feed = this.tempFeedData(i, undefined, content);
      testFeeds.push(testFeed);
    }
    return testFeeds;
  };

  private static readonly DEFAULT_FILE_SIZE = '72.22KB';

  public uploadData = (
    id: number,
    fileExtension: string,
    feedId?: number
  ): UploadFiles => {
    const generateRandomString = (): string => {
      return Math.random().toString(36).substring(2, 12);
    };

    const fileName: string = `fileName.${fileExtension}`;

    const testUploadFiles: UploadFiles = new UploadFiles(
      generateRandomString(),
      fileName,
      MakeTestClass.DEFAULT_FILE_SIZE,
      feedId as unknown as Feed,
      this.userId as unknown as User
    );
    testUploadFiles.id = id;

    return testUploadFiles;
  };

  public generateMultipleUploadData = (
    numFiles: number,
    startIndexId: number = 1,
    fileExtension: string = 'txt'
  ): UploadFiles[] => {
    const fileNames: string[] = Array.from(
      { length: numFiles },
      (_, index: number): string =>
        `file${index + startIndexId}.${fileExtension}`
    );
    return fileNames.map((fileName: string, index: number) =>
      this.uploadData(index + startIndexId, fileName, index + startIndexId)
    );
  };

  // 테스트간 댓글생성을 위한 댓글 클래스 생성
  public static publicComment: string = 'test comment';
  public static deletedComment: string = '## DELETED_COMMENT ##';
  public static privateComment: string = '## PRIVATE_COMMENT ##';
  public commentData = (
    id: number,
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
    testComment.id = id;
    testComment.parent = parent as unknown as Comment;
    testComment.deleted_at = deleted ? new Date() : null;

    return testComment;
  };

  public generateMultipleComments = (
    numFiles: number,
    startIndexId: number = 1,
    feedId: number,
    is_private: boolean = false,
    parent?: number
  ): Comment[] => {
    const testComments: Comment[] = [];
    for (let i: number = startIndexId; i < startIndexId + numFiles; i++) {
      const testComment: Comment = this.commentData(
        i,
        feedId,
        is_private,
        parent
      );
      testComments.push(testComment);
    }
    return testComments;
  };

  // 테스트간 게시물공감 데이터 생성을 위한 클래스 생성
  public feedSymbolData = (feedId: number, symbolId: number): FeedSymbol => {
    return new FeedSymbol(
      this.userId as unknown as User,
      feedId as unknown as Feed,
      symbolId as unknown as Symbol
    );
  };
}
