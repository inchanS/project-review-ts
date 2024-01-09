import { Router } from 'express';
import { asyncWrap } from '../utils/util';
import {
  authValidateOrNext,
  authValidateOrReject,
} from '../middleware/jwt.strategy';
import UserContentController from '../controllers/users/userContent.controller';
import UsersController from '../controllers/users/users.controller';
import AuthController from '../controllers/users/auth.controller';
import ValidatorController from '../controllers/users/validator.controller';

const router = Router();

// 회원가입하기
router.post('/signup', asyncWrap(AuthController.signUp));

// 로그인하기
router.post('/signin', asyncWrap(AuthController.signIn));

// 회원가입시 닉네임 중복체크하기
router.get(
  '/checknickname',
  asyncWrap(ValidatorController.checkDuplicateNickname)
);

// 회원가입시 이메일 중복체크하기
router.get('/checkemail', asyncWrap(ValidatorController.checkDuplicateEmail));

// 유저의 모든 정보 조회하기
// 유저의 모든 게시물 가져오기
router.get(
  '/userinfo/:id?/feeds',
  asyncWrap(authValidateOrNext),
  asyncWrap(UserContentController.getUserFeeds)
);
// 유저의 모든 덧글 가져오기
router.get(
  '/userinfo/:id?/comments',
  asyncWrap(authValidateOrNext),
  asyncWrap(UserContentController.getUserComments)
);
// 유저의 모든 좋아요 가져오기
router.get(
  '/userinfo/:id?/symbols',
  asyncWrap(authValidateOrNext),
  asyncWrap(UserContentController.getUserFeedSymbols)
);
// 유저 가입정보 확인하기
router.get(
  '/userinfo/:id?',
  asyncWrap(authValidateOrNext),
  asyncWrap(UserContentController.getUserInfo) // authValidateOrNext
);

// 유저 정보 수정하기
router.patch(
  '/signup',
  asyncWrap(authValidateOrReject),
  asyncWrap(UsersController.updateUserInfo)
);

// 유저 정보 삭제하기
router.delete(
  '/signup',
  asyncWrap(authValidateOrReject),
  asyncWrap(UsersController.deleteUser)
);

// 유저 비밀번호 찾기 - 이메일로 비밀번호 재설정 링크 보내기
router.post('/signup/password', asyncWrap(AuthController.resetPassword));

export default router;
