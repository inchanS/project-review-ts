import { Router } from 'express';
const router = Router();

import { errHandler } from '../utils/util';
import usersRoute from './users.route';
import feedsRoute from './feeds.route';

router.use('/users', usersRoute);
router.use('/feeds', feedsRoute);

router.use(errHandler);

export default router;
