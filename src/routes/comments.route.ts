import { Router } from 'express';
import { asyncWrap } from '../utils/util';
import commentsController from '../controllers/comments.controller';
import {
  authValidateOrNext,
  authValidateOrReject,
} from '../middleware/jwt.strategy';
const router = Router();

router.get(
  '/:id',
  asyncWrap(authValidateOrNext),
  asyncWrap(commentsController.getCommentList)
);
router.post(
  '',
  asyncWrap(authValidateOrReject),
  asyncWrap(commentsController.createComment)
);
router.patch(
  '',
  asyncWrap(authValidateOrReject),
  asyncWrap(commentsController.updateComment)
);
router.delete(
  '/:id',
  asyncWrap(authValidateOrReject),
  asyncWrap(commentsController.deleteComment)
);
export default router;
