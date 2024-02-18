import { Router } from 'express';
import { asyncWrap } from '../utils/util';
import commentsController from '../controllers/comments.controller';
import {
  authValidateOrNext,
  authValidateOrReject,
} from '../middleware/jwt.strategy';

const router: Router = Router();

// 댓글 생성하기
router.post(
  '',
  asyncWrap(authValidateOrReject),
  asyncWrap(commentsController.createComment)
);

// 댓글 수정하기
router.patch(
  '',
  asyncWrap(authValidateOrReject),
  asyncWrap(commentsController.updateComment)
);

// 게시글당 댓글 목록 조회
router.get(
  '/:id',
  asyncWrap(authValidateOrNext),
  asyncWrap(commentsController.getCommentList)
);

// 댓글 삭제하기
router.delete(
  '/:id',
  asyncWrap(authValidateOrReject),
  asyncWrap(commentsController.deleteComment)
);
export default router;
