import { Request, Response } from 'express';
import commentsService from '../services/comments.service';
import { CommentDto } from '../entities/dto/comment.dto';

const getCommentList = async (req: Request, res: Response) => {
  const id: number = Number(req.params.id);
  const result = await commentsService.getCommentList(id);
  res.status(200).json(result);
};

const createComment = async (req: Request, res: Response) => {
  const user: number = req.userInfo.id;
  const { feed, comment, is_private, parent }: CommentDto = req.body;
  const commentInfo: CommentDto = {
    user,
    feed,
    comment,
    is_private,
    parent,
  };

  await commentsService.createComment(commentInfo);

  res
    .status(201)
    .json({ message: 'THIS_COMMENT_HAS_BEEN_SUCCESSFULLY_CREATED' });
};

const updateComment = async (req: Request, res: Response) => {
  const { comment, is_private }: CommentDto = req.body;
  const commentInfo: CommentDto = { comment, is_private };
  const commentId: number = req.body.commentId;
  const userId: number = req.userInfo.userId;

  await commentsService.updateComment(userId, commentId, commentInfo);

  res
    .status(201)
    .json({ message: `THIS_COMMENT_HAS_BEEN_SUCCESSFULLY_UPDATED` });
};
export default { getCommentList, createComment, updateComment };
