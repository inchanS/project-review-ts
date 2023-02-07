import { Request, Response } from 'express';
import commentsService from '../services/comments.service';
import { CommentDto } from '../entities/dto/comment.dto';

const getCommentList = async (req: Request, res: Response) => {
  const id: number = Number(req.params.id);
  const result = await commentsService.getCommentList(id);
  res.status(200).json(result);
};

const createComment = async (req: Request, res: Response) => {
  const { feed, comment, is_private, parent }: CommentDto = req.body;
  const user = req.userInfo.id;
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
export default { getCommentList, createComment };
