import { Router } from 'express';
const router = Router();

import { errHandler } from '../utils/util';

router.use(errHandler);
export default router;
