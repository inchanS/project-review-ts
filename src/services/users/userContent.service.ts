// 유저 정보 찾기시 유저 정보의 확인
import { UserRepository } from '../../repositories/user.repository';
import { FeedRepository } from '../../repositories/feed.repository';
import { CommentRepository } from '../../repositories/comment.repository';
import { FeedSymbolRepository } from '../../repositories/feedSymbol.repository';
import { CustomError } from '../../utils/util';
import { FeedListRepository } from '../../repositories/feedList.repository';
import { User } from '../../entities/users.entity';
import { Comment } from '../../entities/comment.entity';
import { FeedSymbol } from '../../entities/feedSymbol.entity';
import { CommentFormatter } from '../comments.service';
import {
  CommentListByUserId,
  FeedListByUserId,
  FeedSymbolListByUserId,
} from '../../types/user';
import { ExtendedComment } from '../../types/comment';
import {
  ExtendedFeedlist,
  FeedListOptions,
  Pagination,
} from '../../types/feedList';

export class UserContentService {
  private userRepository: UserRepository;
  private feedRepository: FeedRepository;
  private feedListRepository: FeedListRepository;
  private commentRepository: CommentRepository;
  private feedSymbolRepository: FeedSymbolRepository;

  constructor() {
    this.userRepository = UserRepository.getInstance();
    this.feedRepository = FeedRepository.getInstance();
    this.feedListRepository = FeedListRepository.getInstance();
    this.commentRepository = CommentRepository.getInstance();
    this.feedSymbolRepository = FeedSymbolRepository.getInstance();
  }

  private validateUserId(userId: number): void {
    if (!userId) {
      throw new CustomError(400, 'USER_ID_IS_UNDEFINED');
    }
  }

  private validatePage(page: Pagination): Pagination | undefined {
    if (isNaN(page.startIndex) || isNaN(page.limit)) {
      return undefined;
    } else if (page.startIndex < 1) {
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

  findUserInfoByUserId = async (targetUserId: number): Promise<User> => {
    this.validateUserId(targetUserId);

    const userInfo: User | null = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!userInfo) {
      throw new CustomError(404, 'USER_IS_NOT_FOUND');
    }

    return userInfo;
  };

  // 유저 정보 확인시 유저의 게시글 조회
  findUserFeedsByUserId = async (
    targetUserId: number,
    page: Pagination | undefined,
    options?: FeedListOptions
  ): Promise<FeedListByUserId> => {
    await this.findUserInfoByUserId(targetUserId);
    page = page ? this.validatePage(page) : undefined;

    // 유저의 게시글 수 조회
    const feedCntByUserId: number =
      await this.feedRepository.getFeedCountByUserId(targetUserId);

    // 클라이언트에서 보내준 limit에 따른 총 페이지 수 계산
    const totalPage: number = this.calculateTotalPageCount(
      feedCntByUserId,
      page
    );
    const feedListByUserId: ExtendedFeedlist[] =
      await this.feedListRepository.getFeedListByUserId(
        targetUserId,
        page,
        options
      );

    return { feedCntByUserId, totalPage, feedListByUserId };
  };

  // 유저 정보 확인시 유저의 댓글 조회
  findUserCommentsByUserId = async (
    targetUserId: number,
    loggedInUserId: number,
    page?: Pagination | undefined
  ): Promise<CommentListByUserId> => {
    await this.findUserInfoByUserId(targetUserId);

    if (!page || isNaN(page.startIndex) || isNaN(page.limit)) {
      page = undefined;
    } else if (page.startIndex < 0) {
      throw new CustomError(400, 'PAGE_START_INDEX_IS_INVALID');
    }

    const commentCntByUserId: number =
      await this.commentRepository.getCommentCountByUserId(targetUserId);

    // 클라이언트에서 보내준 limit에 따른 총 무한스크롤 횟수 계산
    let totalScrollCnt: number = this.calculateTotalPageCount(
      commentCntByUserId,
      page
    );

    const originalCommentListByUserId: Comment[] =
      await this.commentRepository.getCommentListByUserId(targetUserId, page);

    const commentListByUserId: ExtendedComment[] =
      originalCommentListByUserId.map((comment: Comment) => {
        return new CommentFormatter(
          comment,
          loggedInUserId,
          comment.parent?.user.id
        ).format();
      });

    return { commentCntByUserId, totalScrollCnt, commentListByUserId };
  };

  // 유저 정보 확인시, 유저의 피드 심볼 조회
  findUserFeedSymbolsByUserId = async (
    targetUserId: number,
    page: Pagination | undefined
  ): Promise<FeedSymbolListByUserId> => {
    await this.findUserInfoByUserId(targetUserId);
    page ? this.validatePage(page) : undefined;

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
}
