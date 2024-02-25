// 유저의 가입정보 가져오기
import { Request, Response } from 'express';
import { UserContentService } from '../../services/users/userContent.service';
import { User } from '../../entities/users.entity';
import {
  CommentListByUserId,
  FeedListByUserId,
  FeedSymbolListByUserId,
} from '../../types/user';

class UserContentController {
  constructor(private userContentService: UserContentService) {}
  getUserInfo = async (req: Request, res: Response): Promise<void> => {
    let targetUserId: number = Number(req.params.id);
    const loggedInUserId: number = req.userInfo.id;

    if (!targetUserId) {
      targetUserId = loggedInUserId;
    }
    const result: User = await this.userContentService.findUserInfoByUserId(
      targetUserId
    );

    res.status(200).json(result);
  };

  // 유저의 모든 게시물 가져오기
  getUserFeeds = async (req: Request, res: Response): Promise<void> => {
    let targetUserId: number = Number(req.params.id);
    const loggedInUserId: number = req.userInfo.id;

    if (!targetUserId) {
      targetUserId = loggedInUserId;
    }

    const startIndex: number = Number(req.query.page);
    const limit: number = Number(req.query.limit);
    const page: Pagination = { startIndex, limit };

    const result: FeedListByUserId =
      await this.userContentService.findUserFeedsByUserId(targetUserId, page);

    res.status(200).json(result);
  };

  // 유저의 모든 덧글 가져오기
  getUserComments = async (req: Request, res: Response): Promise<void> => {
    let targetUserId: number = Number(req.params.id);
    const loggedInUserId: number = req.userInfo.id;

    if (!targetUserId) {
      targetUserId = loggedInUserId;
    }

    const startIndex: number = Number(req.query.index);
    const limit: number = Number(req.query.limit);
    const page: Pagination = { startIndex, limit };

    const result: CommentListByUserId =
      await this.userContentService.findUserCommentsByUserId(
        targetUserId,
        loggedInUserId,
        page
      );

    res.status(200).json(result);
  };

  // 유저의 모든 좋아요 가져오기
  getUserFeedSymbols = async (req: Request, res: Response): Promise<void> => {
    let targetUserId: number = Number(req.params.id);
    const loggedInUserId: number = req.userInfo.id;

    if (!targetUserId) {
      targetUserId = loggedInUserId;
    }

    const startIndex: number = Number(req.query.page);
    const limit: number = Number(req.query.limit);
    const page: Pagination = { startIndex, limit };

    const result: FeedSymbolListByUserId =
      await this.userContentService.findUserFeedSymbolsByUserId(
        targetUserId,
        page
      );

    res.status(200).json(result);
  };
}

export default new UserContentController(new UserContentService());
