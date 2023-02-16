import { Router } from 'express';
const router = Router();

import usersController from '../controllers/users.controller';
import { asyncWrap } from '../utils/util';
import { authValidateOrReject } from '../middleware/jwt.strategy';

router.post('/signup', asyncWrap(usersController.signUp));
router.get('/signup', asyncWrap(usersController.checkDuplicateNickname));
router.post('/signin', asyncWrap(usersController.signIn));
router.get(
  '/getme',
  asyncWrap(authValidateOrReject),
  asyncWrap(usersController.getMe)
);

export default router;
