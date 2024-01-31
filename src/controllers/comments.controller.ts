import { Request, Response } from 'express';
import { CommentDto } from '../entities/dto/comment.dto';
import { CommentsService } from '../services/comments.service';

class CommentsController {
  private commentsService: CommentsService;

  constructor() {
    this.commentsService = new CommentsService();
  }
  getCommentList = async (req: Request, res: Response) => {
    const feedId: number = Number(req.params.id);
    const userId: number = req.userInfo.id;

    const result = await this.commentsService.getCommentList(feedId, userId);
    res.status(200).json(result);
  };

  createComment = async (req: Request, res: Response) => {
    const user: number = req.userInfo.id;
    const { feed, comment, is_private, parent }: CommentDto = req.body;
    const commentInfo: CommentDto = {
      user,
      feed,
      comment,
      is_private,
      parent,
    };

    await this.commentsService.createComment(commentInfo);
    res
      .status(201)
      .json({ message: 'THIS_COMMENT_HAS_BEEN_SUCCESSFULLY_CREATED' });
  };

  updateComment = async (req: Request, res: Response) => {
    const { comment, is_private }: CommentDto = req.body;
    const commentInfo: CommentDto = { comment, is_private };
    const commentId: number = req.body.commentId;
    const userId: number = req.userInfo.id;

    await this.commentsService.updateComment(userId, commentId, commentInfo);
    res
      .status(201)
      .json({ message: `THIS_COMMENT_HAS_BEEN_SUCCESSFULLY_UPDATED` });
  };

  deleteComment = async (req: Request, res: Response) => {
    const commentId: number = Number(req.params.id);
    const userId: number = req.userInfo.id;

    await this.commentsService.deleteComment(commentId, userId);
    res
      .status(200)
      .json({ message: `THIS_COMMENT_HAS_BEEN_SUCCESSFULLY_DELETED` });
  };
}

export default new CommentsController();
