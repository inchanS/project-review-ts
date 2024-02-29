import { Request, Response } from 'express';
import { CommentDto } from '../entities/dto/comment.dto';
import { CommentsService } from '../services/comments.service';
import { Comment } from '../entities/comment.entity';

class CommentsController {
  constructor(private commentsService: CommentsService) {}

  getCommentList = async (req: Request, res: Response): Promise<void> => {
    const feedId: number = Number(req.params.id);
    const userId: number = req.userInfo?.id;

    // TODO 무한스크롤
    const result = await this.commentsService.getCommentList(feedId, userId);
    res.status(200).json(result);
  };

  createComment = async (req: Request, res: Response): Promise<void> => {
    const user: number = req.userInfo.id;
    const { feed, comment, is_private, parent }: CommentDto = req.body;
    const commentInfo: CommentDto = {
      user,
      feed,
      comment,
      is_private,
      parent,
    };

    const result: Comment = await this.commentsService.createComment(
      commentInfo
    );
    res
      .status(201)
      .json({ message: 'THIS_COMMENT_HAS_BEEN_SUCCESSFULLY_CREATED', result });
  };

  updateComment = async (req: Request, res: Response): Promise<void> => {
    const { comment, is_private }: CommentDto = req.body;
    const commentInfo: CommentDto = { comment, is_private };
    const commentId: number = req.body.commentId;
    const userId: number = req.userInfo.id;

    const result: Comment = await this.commentsService.updateComment(
      userId,
      commentId,
      commentInfo
    );
    res
      .status(201)
      .json({ message: `THIS_COMMENT_HAS_BEEN_SUCCESSFULLY_UPDATED`, result });
  };

  deleteComment = async (req: Request, res: Response): Promise<void> => {
    const commentId: number = Number(req.params.id);
    const userId: number = req.userInfo.id;

    await this.commentsService.deleteComment(commentId, userId);
    res
      .status(200)
      .json({ message: `THIS_COMMENT_HAS_BEEN_SUCCESSFULLY_DELETED` });
  };
}

export default new CommentsController(new CommentsService());
