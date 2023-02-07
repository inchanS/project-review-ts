import { Router } from 'express';
import { asyncWrap } from '../utils/util';
const router = Router();

import feedsController from '../controllers/feeds.controller';
import { authMiddleware } from '../middleware/jwt.strategy';

router.post(
  '/post',
  asyncWrap(authMiddleware),
  asyncWrap(feedsController.createFeed)
);
router.get('', asyncWrap(feedsController.getFeedList));

export default router;
