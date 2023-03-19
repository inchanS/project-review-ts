import { Router } from 'express';
import { asyncWrap } from '../utils/util';
import feedsController from '../controllers/feeds.controller';
import { authValidateOrReject } from '../middleware/jwt.strategy';

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
