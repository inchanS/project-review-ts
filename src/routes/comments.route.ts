import { Router } from 'express';
import { asyncWrap } from '../utils/util';
import commentsController from '../controllers/comments.controller';
import { authMiddleware } from '../middleware/jwt.strategy';
const router = Router();

// TODO 비로그인 사용자의 경우 게시물 열람 가능하게!!
router.get(
  '/:id',
  asyncWrap(authMiddleware),
  asyncWrap(commentsController.getCommentList)
);
router.post(
  '',
  asyncWrap(authMiddleware),
  asyncWrap(commentsController.createComment)
);
router.patch(
  '',
  asyncWrap(authMiddleware),
  asyncWrap(commentsController.updateComment)
);
router.delete(
  '',
  asyncWrap(authMiddleware),
  asyncWrap(commentsController.deleteComment)
);
export default router;
