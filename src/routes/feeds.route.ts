import { Router } from 'express';
import { asyncWrap } from '../utils/util';
const router = Router();

import feedsController from '../controllers/feeds.controller';

router.post('/post', asyncWrap(feedsController.createFeed));
router.get('', asyncWrap(feedsController.getFeedList));

export default router;
