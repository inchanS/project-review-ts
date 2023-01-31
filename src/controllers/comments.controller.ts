import { Request, Response } from 'express';
import commentsService from '../services/comments.service';

const getCommentList = async (req: Request, res: Response) => {
  const id: number = Number(req.params.id);
  const result = await commentsService.getCommentList(id);
  res.status(200).json(result);
};

export default { getCommentList };
