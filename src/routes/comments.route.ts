import { Router } from 'express';
import { asyncWrap } from '../utils/util';
import commentsController from '../controllers/comments.controller';
import { authMiddleware } from '../middleware/jwt.strategy';
const router = Router();

router.get('/:id', asyncWrap(commentsController.getCommentList));
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
