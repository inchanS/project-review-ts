// 유저의 가입정보 가져오기
import { Request, Response } from 'express';
import { UserContentService } from '../../services/users/userContent.service';
import { Pagination } from '../../repositories/feedList.repository';

class UserContentController {
  private userContentService: UserContentService;

  constructor() {
    this.userContentService = new UserContentService();
  }
  getUserInfo = async (req: Request, res: Response): Promise<void> => {
    let targetUserId = Number(req.params.id);
    const loggedInUserId = req.userInfo.id;

    if (!targetUserId) {
      targetUserId = loggedInUserId;
    }
    const result = await this.userContentService.findUserInfoByUserId(
      targetUserId
    );

    res.status(200).json(result);
  };

  // 유저의 모든 게시물 가져오기
  getUserFeeds = async (req: Request, res: Response): Promise<void> => {
    let targetUserId = Number(req.params.id);
    const loggedInUserId = req.userInfo.id;

    if (!targetUserId) {
      targetUserId = loggedInUserId;
    }

    const startIndex = Number(req.query.page);
    const limit = Number(req.query.limit);
    const page: Pagination = { startIndex, limit };

    const result = await this.userContentService.findUserFeedsByUserId(
      targetUserId,
      page
    );

    res.status(200).json(result);
  };

  // 유저의 모든 덧글 가져오기
  getUserComments = async (req: Request, res: Response): Promise<void> => {
    let targetUserId = Number(req.params.id);
    const loggedInUserId = req.userInfo.id;

    if (!targetUserId) {
      targetUserId = loggedInUserId;
    }

    const startIndex = Number(req.query.index);
    const limit = Number(req.query.limit);
    const page: Pagination = { startIndex, limit };

    const result = await this.userContentService.findUserCommentsByUserId(
      targetUserId,
      loggedInUserId,
      page
    );

    res.status(200).json(result);
  };

  // 유저의 모든 좋아요 가져오기
  getUserFeedSymbols = async (req: Request, res: Response): Promise<void> => {
    let targetUserId = Number(req.params.id);
    const loggedInUserId = req.userInfo.id;

    if (!targetUserId) {
      targetUserId = loggedInUserId;
    }

    const startIndex = Number(req.query.page);
    const limit = Number(req.query.limit);
    const page: Pagination = { startIndex, limit };

    const result = await this.userContentService.findUserFeedSymbolsByUserId(
      targetUserId,
      page
    );

    res.status(200).json(result);
  };
}

export default new UserContentController();
