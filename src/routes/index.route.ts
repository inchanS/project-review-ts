import { Router } from 'express';
const router = Router();

import { errHandler, notFoundHandler } from '../utils/util';
import usersRoute from './users.route';
import feedsRoute from './feeds.route';
import commentsRoute from './comments.route';
import categoriesRoute from './categories.route';
import uploadRoute from './upload.route';
import symbolsRoute from './symbols.route';
import searchRoute from './search.route';
import testRoute from './test.route';

router.use('/users', usersRoute);
router.use('/feeds', feedsRoute);
router.use('/comments', commentsRoute);
router.use('/categories', categoriesRoute);
router.use('/symbols', symbolsRoute);
router.use('/upload', uploadRoute);
router.use('/search', searchRoute);
router.use('/test', testRoute);

// 에러핸들러
router.use(notFoundHandler);
router.use(errHandler);

export default router;
