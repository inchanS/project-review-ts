import { Router } from 'express';
const router = Router();

import usersController from '../controllers/users.controller';
import { asyncWrap } from '../utils/util';
import {
  authValidateOrNext,
  authValidateOrReject,
} from '../middleware/jwt.strategy';

router.post('/signup', asyncWrap(usersController.signUp));
router.get('/checknickname', asyncWrap(usersController.checkDuplicateNickname));
router.get('/checkemail', asyncWrap(usersController.checkDuplicateEmail));
router.post('/signin', asyncWrap(usersController.signIn));
router.get(
  '/getme',
  asyncWrap(authValidateOrReject),
  asyncWrap(usersController.getMe)
);
router.get(
  '/userinfo/:id',
  asyncWrap(authValidateOrNext),
  asyncWrap(usersController.getUserInfo)
);

export default router;
