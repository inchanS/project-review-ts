import { Router } from 'express';
const router = Router();

import usersController from '../controllers/users.controller';
import { asyncWrap } from '../utils/util';
import {
  authValidateOrNext,
  authValidateOrReject,
} from '../middleware/jwt.strategy';

// 회원가입하기
router.post('/signup', asyncWrap(usersController.signUp));

// 로그인하기
router.post('/signin', asyncWrap(usersController.signIn));

// 회원가입시 닉네임 중복체크하기
router.get('/checknickname', asyncWrap(usersController.checkDuplicateNickname));

// 회원가입시 이메일 중복체크하기
router.get('/checkemail', asyncWrap(usersController.checkDuplicateEmail));

// 로그인 유저의 모든 정보 조회하기
router.get(
  '/getme',
  asyncWrap(authValidateOrReject),
  asyncWrap(usersController.getMe)
);

// 타겟 유저의 정보 조회하기
router.get(
  '/userinfo/:id',
  asyncWrap(authValidateOrNext),
  asyncWrap(usersController.getUserInfo)
);

export default router;
