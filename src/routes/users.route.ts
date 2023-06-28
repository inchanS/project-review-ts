import { Router } from 'express';
import { asyncWrap } from '../utils/util';
import {
  authValidateOrNext,
  authValidateOrReject,
} from '../middleware/jwt.strategy';
import authController from '../controllers/users/auth.controller';
import validatorController from '../controllers/users/validator.controller';
import userContentController from '../controllers/users/userContent.controller';
import usersController from '../controllers/users/users.controller';

const router = Router();

// 회원가입하기
router.post('/signup', asyncWrap(authController.signUp));

// 로그인하기
router.post('/signin', asyncWrap(authController.signIn));

// 회원가입시 닉네임 중복체크하기
router.get(
  '/checknickname',
  asyncWrap(validatorController.checkDuplicateNickname)
);

// 회원가입시 이메일 중복체크하기
router.get('/checkemail', asyncWrap(validatorController.checkDuplicateEmail));

// 유저의 모든 정보 조회하기
// 유저의 모든 게시물 가져오기
router.get(
  '/userinfo/:id?/feeds',
  asyncWrap(authValidateOrNext),
  asyncWrap(userContentController.getUserFeeds)
);
// 유저의 모든 덧글 가져오기
router.get(
  '/userinfo/:id?/comments',
  asyncWrap(authValidateOrNext),
  asyncWrap(userContentController.getUserComments)
);
// 유저의 모든 좋아요 가져오기
router.get(
  '/userinfo/:id?/symbols',
  asyncWrap(authValidateOrNext),
  asyncWrap(userContentController.getUserFeedSymbols)
);
// 유저 가입정보 확인하기
router.get(
  '/userinfo/:id?',
  asyncWrap(authValidateOrNext),
  asyncWrap(userContentController.getUserInfo) // authValidateOrNext
);

// 유저 정보 수정하기
router.patch(
  '/signup',
  asyncWrap(authValidateOrReject),
  asyncWrap(usersController.updateUserInfo)
);

// 유저 정보 삭제하기
router.delete(
  '/signup',
  asyncWrap(authValidateOrReject),
  asyncWrap(usersController.deleteUser)
);

// 유저 비밀번호 찾기 - 이메일로 비밀번호 재설정 링크 보내기
router.post('/signup/password', asyncWrap(authController.resetPassword));

export default router;
