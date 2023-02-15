import { Router } from 'express';
const router = Router();

import { errHandler } from '../utils/util';
import usersRoute from './users.route';
import feedsRoute from './feeds.route';
import commentsRoute from './comments.route';
import categoriesRoute from './categories.route';

router.use('/users', usersRoute);
router.use('/feeds', feedsRoute);
router.use('/comments', commentsRoute);
router.use('/categories', categoriesRoute);

router.use(errHandler);

export default router;
