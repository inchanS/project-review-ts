import { Router } from 'express';
const router = Router();

import { errHandler } from '../utils/util';
import usersRoute from './users.route';

router.use('/users', usersRoute);

router.use(errHandler);

export default router;
