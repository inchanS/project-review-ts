import { Request, Response } from 'express';
import commentsService from '../services/comments.service';
import { Comment } from '../entities/comment.entity';

const getCommentList = async (req: Request, res: Response) => {
  const id: number = Number(req.params.id);
  const result = await commentsService.getCommentList(id);
  res.status(200).json(result);
};

const createComment = async (req: Request, res: Response) => {
  const { user, feed, comment, is_private }: Comment = req.body;
  const commentInfo: Comment = { user, feed, comment, is_private };

  await commentsService.createComment(commentInfo);
  res
    .status(201)
    .json({ message: 'YOUR_COMMENT_HAS_BEEN_SUCCESSFULLY_CREATED' });
};
export default { getCommentList, createComment };
