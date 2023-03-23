import { Router } from 'express';
import { asyncWrap } from '../utils/util';
import feedsController from '../controllers/feeds.controller';
import {
  authValidateOrNext,
  authValidateOrReject,
} from '../middleware/jwt.strategy';

const router = Router();

// 임시저장글 ------------------------------------------------
router.get(
  '/temp',
  asyncWrap(authValidateOrReject),
  asyncWrap(feedsController.getTempFeedList)
);

router.post(
  '/temp',
  asyncWrap(authValidateOrReject),
  asyncWrap(feedsController.createTempFeed)
);

router.patch(
  '/temp',
  asyncWrap(authValidateOrReject),
  asyncWrap(feedsController.updateTempFeed)
);

// 게시글 ------------------------------------------------

// 게시글 작성시 필요한 상품 추천여부 데이터 불러오기
router.get('/estimations', asyncWrap(feedsController.getEstimations));

// 게시글 리스트 가져오기
router.get('', asyncWrap(feedsController.getFeedList));

// 게시글 상세보기
router.get(
  '/:feedId',
  asyncWrap(authValidateOrNext),
  asyncWrap(feedsController.getFeed)
);

// 게시글 작성
router.post(
  '/post',
  asyncWrap(authValidateOrReject),
  asyncWrap(feedsController.createFeed)
);

// 게시글 수정
router.patch(
  '/post',
  asyncWrap(authValidateOrReject),
  asyncWrap(feedsController.updateFeed)
);

export default router;
