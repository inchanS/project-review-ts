import { Router } from 'express';
import { asyncWrap } from '../utils/util';
import feedsController from '../controllers/feeds.controller';
import {
  authValidateOrNext,
  authValidateOrReject,
} from '../middleware/jwt.strategy';

const router = Router();

// 임시저장 ------------------------------------------------
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

// FIXME getFeed 라우팅 주소 변경하고, tempFeed.yaml에도 반영해야함
router.get(
  '/temp/:feedId',
  asyncWrap(authValidateOrNext),
  asyncWrap(feedsController.getTempFeed)
);

// 게시글 ------------------------------------------------
router.post(
  '/post',
  asyncWrap(authValidateOrReject),
  asyncWrap(feedsController.createFeed)
);

router.patch(
  '/post',
  asyncWrap(authValidateOrReject),
  asyncWrap(feedsController.updateFeed)
);

router.get('/estimations', asyncWrap(feedsController.getEstimations));

router.get('', asyncWrap(feedsController.getFeedList));

export default router;
