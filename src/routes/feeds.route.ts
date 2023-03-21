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
// 게시글 리스트 가져오기
router.get('', asyncWrap(feedsController.getFeedList));

// 게시글 상세보기
// FIXME getFeed 라우팅 주소 변경하고, tempFeed.yaml에도 반영해야함
router.get(
  '/:feedId',
  asyncWrap(authValidateOrNext),
  asyncWrap(feedsController.getTempFeed)
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

// 게시글 작성시 필요한 상품 추천여부 데이터 불러오기
router.get('/estimations', asyncWrap(feedsController.getEstimations));

export default router;
