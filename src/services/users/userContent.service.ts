// 유저 정보 찾기시 유저 정보의 확인
import { UserRepository } from '../../repositories/user.repository';
import { FeedRepository } from '../../repositories/feed.repository';
import { CommentRepository } from '../../repositories/comment.repository';
import { FeedSymbolRepository } from '../../repositories/feedSymbol.repository';
import { CustomError } from '../../utils/util';
import {
  FeedListOptions,
  FeedListRepository,
  Pagination,
} from '../../repositories/feedList.repository';

export class UserContentService {
  private userRepository: UserRepository;
  private feedRepository: FeedRepository;
  private feedListRepository: FeedListRepository;
  private commentRepository: CommentRepository;
  private feedSymbolRepository: FeedSymbolRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.feedRepository = FeedRepository.getInstance();
    this.feedListRepository = FeedListRepository.getInstance();
    this.commentRepository = CommentRepository.getInstance();
    this.feedSymbolRepository = new FeedSymbolRepository();
  }

  private validateUserId(userId: number) {
    if (!userId) {
      throw new CustomError(400, 'USER_ID_IS_UNDEFINED');
    }
  }

  private validatePage(page: Pagination) {
    if (isNaN(page.startIndex) || isNaN(page.limit)) {
      return undefined;
    } else if (page.startIndex < 1) {
      throw new CustomError(400, 'PAGE_START_INDEX_IS_INVALID');
    }
    return page;
  }

  private calculateTotalPageCount(totalItems: number, page: Pagination) {
    return page?.limit ? Math.ceil(totalItems / page.limit) : 1;
  }

  findUserInfoByUserId = async (targetUserId: number) => {
    this.validateUserId(targetUserId);

    const userInfo = await this.userRepository.findOne({
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
    page: Pagination,
    options?: FeedListOptions
  ) => {
    await this.findUserInfoByUserId(targetUserId);
    page = this.validatePage(page);

    // 유저의 게시글 수 조회
    const feedCntByUserId: number =
      await this.feedRepository.getFeedCountByUserId(targetUserId);

    // 클라이언트에서 보내준 limit에 따른 총 페이지 수 계산
    const totalPage: number = this.calculateTotalPageCount(
      feedCntByUserId,
      page
    );
    const feedListByUserId = await this.feedListRepository.getFeedListByUserId(
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
    page?: Pagination
  ) => {
    await this.findUserInfoByUserId(targetUserId);

    if (isNaN(page.startIndex) || isNaN(page.limit)) {
      page = undefined;
    } else if (page.startIndex < 0) {
      throw new CustomError(400, 'PAGE_START_INDEX_IS_INVALID');
    }

    const commentCntByUserId =
      await this.commentRepository.getCommentCountByUserId(targetUserId);

    // 클라이언트에서 보내준 limit에 따른 총 무한스크롤 횟수 계산
    let totalScrollCnt: number = this.calculateTotalPageCount(
      commentCntByUserId,
      page
    );

    const commentListByUserId: any =
      await this.commentRepository.getCommentListByUserId(targetUserId, page);

    for (const comment of commentListByUserId) {
      const isPrivate: boolean =
        comment.is_private === true &&
        comment.user.id !== loggedInUserId &&
        (comment.parent
          ? comment.parent.user.id !== loggedInUserId
          : comment.feed.user.id !== loggedInUserId);
      const isDeleted: boolean = comment.deleted_at !== null;
      comment.comment = isDeleted
        ? '## DELETED_COMMENT ##'
        : isPrivate
        ? '## PRIVATE_COMMENT ##'
        : comment.comment;

      // Date타입 재가공
      comment.created_at = comment.created_at.substring(0, 19);
      comment.updated_at = comment.updated_at.substring(0, 19);
      comment.deleted_at = comment.deleted_at
        ? comment.deleted_at.substring(0, 19)
        : null;
    }

    return { commentCntByUserId, totalScrollCnt, commentListByUserId };
  };

  // 유저 정보 확인시, 유저의 피드 심볼 조회
  findUserFeedSymbolsByUserId = async (
    targetUserId: number,
    page: Pagination
  ) => {
    await this.findUserInfoByUserId(targetUserId);
    page = this.validatePage(page);

    const symbolCntByUserId =
      await this.feedSymbolRepository.getFeedSymbolCountByUserId(targetUserId);

    // 클라이언트에서 보내준 limit에 따른 총 페이지 수 계산
    const totalPage: number = this.calculateTotalPageCount(
      symbolCntByUserId,
      page
    );

    const symbolListByUserId =
      await this.feedSymbolRepository.getFeedSymbolsByUserId(
        targetUserId,
        page
      );

    return { symbolCntByUserId, totalPage, symbolListByUserId };
  };
}
