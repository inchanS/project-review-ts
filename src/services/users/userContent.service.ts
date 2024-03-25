// 유저 정보 찾기시 유저 정보의 확인
import { FeedRepository } from '../../repositories/feed.repository';
import { CommentRepository } from '../../repositories/comment.repository';
import { FeedSymbolRepository } from '../../repositories/feedSymbol.repository';
import { CustomError } from '../../utils/util';
import { FeedListRepository } from '../../repositories/feedList.repository';
import { Comment } from '../../entities/comment.entity';
import { FeedSymbol } from '../../entities/feedSymbol.entity';
import { CommentFormatter } from '../comments.service';
import {
  CommentListByUserId,
  FeedListByUserId,
  FeedSymbolListByUserId,
} from '../../types/user';
import { FeedList } from '../../entities/viewEntities/viewFeedList.entity';

export class UserContentService {
  private feedRepository: FeedRepository;
  private feedListRepository: FeedListRepository;
  private commentRepository: CommentRepository;
  private feedSymbolRepository: FeedSymbolRepository;

  constructor() {
    this.feedRepository = FeedRepository.getInstance();
    this.feedListRepository = FeedListRepository.getInstance();
    this.commentRepository = CommentRepository.getInstance();
    this.feedSymbolRepository = FeedSymbolRepository.getInstance();
  }

  // 유저 정보 확인시 유저의 게시글 조회
  public findUserFeedsByUserId = async (
    targetUserId: number,
    page: Pagination | undefined,
    options?: FeedListOptions
  ): Promise<FeedListByUserId> => {
    if (!targetUserId) {
      throw new CustomError(400, 'NOT_FOUND_TARGET_USER_ID');
    }

    page = page ? this.validatePage(page, 1) : undefined;

    const feedCntByUserId: number =
      await this.feedRepository.getFeedCountByUserId(targetUserId);

    const totalPage: number = this.calculateTotalPageCount(
      feedCntByUserId,
      page
    );

    const feedListByUserId: FeedList[] =
      await this.feedListRepository.getFeedListByUserId(
        targetUserId,
        page,
        options
      );

    return { feedCntByUserId, totalPage, feedListByUserId };
  };

  // 유저 정보 확인시 유저의 댓글 조회
  public findUserCommentsByUserId = async (
    targetUserId: number,
    loggedInUserId: number,
    page?: Pagination | undefined
  ): Promise<CommentListByUserId> => {
    if (!targetUserId) {
      throw new CustomError(400, 'NOT_FOUND_TARGET_USER_ID');
    }

    // 덧글은 페이지가 아닌 무한스크롤 기준이기에 index 최소값이 0부터 시작한다.
    page = page ? this.validatePage(page, 0) : undefined;

    const commentCntByUserId: number =
      await this.commentRepository.getCommentCountByUserId(targetUserId);

    // 클라이언트에서 보내준 limit에 따른 총 무한스크롤 횟수 계산
    const totalScrollCnt: number = this.calculateTotalPageCount(
      commentCntByUserId,
      page
    );

    const commentListByUserId: Comment[] =
      await this.getFormattedCommentListByUserId(
        targetUserId,
        loggedInUserId,
        page
      );

    return { commentCntByUserId, totalScrollCnt, commentListByUserId };
  };

  // 유저 정보 확인시, 유저의 피드 심볼 조회
  public findUserFeedSymbolsByUserId = async (
    targetUserId: number,
    page: Pagination | undefined
  ): Promise<FeedSymbolListByUserId> => {
    page ? this.validatePage(page, 1) : undefined;

    const symbolCntByUserId: number =
      await this.feedSymbolRepository.getFeedSymbolCountByUserId(targetUserId);

    // 클라이언트에서 보내준 limit에 따른 총 페이지 수 계산
    const totalPage: number = this.calculateTotalPageCount(
      symbolCntByUserId,
      page
    );

    const symbolListByUserId: FeedSymbol[] =
      await this.feedSymbolRepository.getFeedSymbolsByUserId(
        targetUserId,
        page
      );

    return { symbolCntByUserId, totalPage, symbolListByUserId };
  };

  private validatePage(
    page: Pagination,
    minimumValue: number
  ): Pagination | undefined {
    if (isNaN(page.startIndex) || isNaN(page.limit)) {
      return undefined;
    } else if (page.startIndex < minimumValue) {
      throw new CustomError(400, 'PAGE_START_INDEX_IS_INVALID');
    }
    return page;
  }

  private calculateTotalPageCount(
    totalItems: number,
    page: Pagination | undefined
  ): number {
    return page?.limit ? Math.ceil(totalItems / page.limit) : 1;
  }

  private getFormattedCommentListByUserId = async (
    targetUserId: number,
    loggedInUserId: number,
    page: Pagination | undefined
  ): Promise<Comment[]> => {
    const originalCommentListByUserId: Comment[] =
      await this.commentRepository.getCommentListByUserId(targetUserId, page);

    return originalCommentListByUserId.map((comment: Comment) => {
      const parentId: number | undefined = comment.parent?.user.id ?? undefined;

      return new CommentFormatter(comment, loggedInUserId, parentId).format();
    });
  };
}
