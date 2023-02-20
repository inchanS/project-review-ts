import { Router } from 'express';
import { asyncWrap } from '../utils/util';
const router = Router();

import feedsController from '../controllers/feeds.controller';
import { authValidateOrReject } from '../middleware/jwt.strategy';

router.post(
  '/temp',
  asyncWrap(authValidateOrReject),
  asyncWrap(feedsController.createTempFeed)
);

router.post(
  '/post',
  asyncWrap(authValidateOrReject),
  asyncWrap(feedsController.createFeed)
);

router.get('', asyncWrap(feedsController.getFeedList));

export default router;
