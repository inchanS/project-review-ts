// 유저 정보 찾기시 유저 정보의 확인
import { UserRepository } from '../../repositories/user.repository';
import {
  FeedListOptions,
  FeedListRepository,
  FeedRepository,
  Pagination,
} from '../../repositories/feed.repository';
import { CommentRepository } from '../../repositories/comment.repository';
import { FeedSymbolRepository } from '../../repositories/feedSymbol.repository';

const findUserInfoByUserId = async (targetUserId: number) => {
  if (!targetUserId) {
    throw { status: 400, message: 'USER_ID_IS_UNDEFINED' };
  }

  const userInfo = await UserRepository.findOne({
    where: { id: targetUserId },
  });

  if (!userInfo) {
    const error = new Error('USER_IS_NOT_FOUND');
    error.status = 404;
    throw error;
  }

  return userInfo;
};

// 유저 정보 확인시 유저의 게시글 조회
const findUserFeedsByUserId = async (
  targetUserId: number,
  page: Pagination,
  options?: FeedListOptions
) => {
  if (!targetUserId) {
    throw { status: 400, message: 'USER_ID_IS_UNDEFINED' };
  }

  if (isNaN(page.startIndex) || isNaN(page.limit)) {
    page = undefined;
  } else if (page.startIndex < 1) {
    throw { status: 400, message: 'PAGE_START_INDEX_IS_INVALID' };
  }

  // 유저의 게시글 수 조회
  const feedCntByUserId = await FeedRepository.getFeedCountByUserId(
    targetUserId
  );

  // 클라이언트에서 보내준 limit에 따른 총 페이지 수 계산
  let totalPage: number;
  if (!page?.limit) {
    totalPage = 1;
  } else {
    totalPage = Math.ceil(feedCntByUserId / page.limit);
  }

  const feedListByUserId = await FeedListRepository.getFeedListByUserId(
    targetUserId,
    page,
    options
  );

  return { feedCntByUserId, totalPage, feedListByUserId };
};

// 유저 정보 확인시 유저의 댓글 조회
const findUserCommentsByUserId = async (
  targetUserId: number,
  loggedInUserId: number,
  page?: Pagination
) => {
  if (!targetUserId) {
    throw { status: 400, message: 'USER_ID_IS_UNDEFINED' };
  }

  if (isNaN(page.startIndex) || isNaN(page.limit)) {
    page = undefined;
  }

  const commentCntByUserId = await CommentRepository.getCommentCountByUserId(
    targetUserId
  );

  // 클라이언트에서 보내준 limit에 따른 총 무한스크롤 횟수 계산
  let totalScrollCnt: number;
  if (!page?.limit) {
    totalScrollCnt = 1;
  } else {
    totalScrollCnt = Math.ceil(commentCntByUserId / page.limit);
  }

  const commentListByUserId = await CommentRepository.getCommentListByUserId(
    targetUserId,
    page
  );

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
const findUserFeedSymbolsByUserId = async (
  targetUserId: number,
  page: Pagination
) => {
  if (!targetUserId) {
    throw { status: 400, message: 'USER_ID_IS_UNDEFINED' };
  }

  const symbolCntByUserId =
    await FeedSymbolRepository.getFeedSymbolCountByUserId(targetUserId);

  // 클라이언트에서 보내준 limit에 따른 총 페이지 수 계산
  let totalPage: number;
  if (!page?.limit) {
    totalPage = 1;
  } else {
    totalPage = Math.ceil(symbolCntByUserId / page.limit);
  }
  if (Number.isInteger(page.startIndex) && Number.isInteger(page.limit)) {
    if (page.startIndex < 1) {
      throw { status: 400, message: 'PAGE_START_INDEX_IS_INVALID' };
    }
  }

  const symbolListByUserId = await FeedSymbolRepository.getFeedSymbolsByUserId(
    targetUserId,
    page
  );

  return { symbolCntByUserId, totalPage, symbolListByUserId };
};

export default {
  findUserInfoByUserId,
  findUserFeedsByUserId,
  findUserCommentsByUserId,
  findUserFeedSymbolsByUserId,
};
