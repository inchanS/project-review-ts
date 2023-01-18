import { Router } from 'express';
const router = Router();

import usersController from '../controllers/users.controller';
import { asyncWrap } from '../utils/util';

router.post('/signup', asyncWrap(usersController.signUp));
router.post('/signin', asyncWrap(usersController.signIn));

export default router;
