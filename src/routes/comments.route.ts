import { Router } from 'express';
import { asyncWrap } from '../utils/util';
import commentsController from '../controllers/comments.controller';
const router = Router();

router.get('/:id', asyncWrap(commentsController.getCommentList));

export default router;
