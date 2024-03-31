import { Request, Response } from 'express';
import { FeedDto } from '../entities/dto/feed.dto';
import { TempFeedDto } from '../entities/dto/tempFeed.dto';
import { Feed } from '../entities/feed.entity';
import { FeedsService } from '../services/feeds.service';
import { CustomError } from '../utils/util';
import { Estimation } from '../entities/estimation.entity';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import { createFeedsService } from '../utils/serviceFactory';

// 임시저장 ==================================================================
// 임시저장 게시글 리스트 --------------------------------------------------------
export class FeedsController {
  constructor(private feedsService: FeedsService) {}

  getTempFeedList = async (req: Request, res: Response): Promise<void> => {
    const user: number = req.userInfo.id;
    const result = await this.feedsService.getTempFeedList(user);

    res.status(200).json({ message: `check temporary feed success`, result });
  };

  // 임시저장 및 정식 게시글 불러오기 -----------------------------------------------------------
  getFeed = async (req: Request, res: Response): Promise<void> => {
    const user: number = req.userInfo?.id;
    const feedId: number = Number(req.params.feedId);

    const result = await this.feedsService.getFeed(user, feedId, {
      isAll: true,
    });

    res.status(200).json({ message: `check feed success`, result });
  };

  // 게시글 임시저장 -----------------------------------------------------------
  createTempFeed = async (req: Request, res: Response): Promise<void> => {
    const user: number = req.userInfo.id;
    const { title, content, estimation, category }: TempFeedDto = req.body;
    const fileLinks: string[] = req.body.fileLinks;

    const feedInfo: TempFeedDto = {
      user,
      title,
      content,
      estimation,
      category,
    };

    // 임시저장 특성상 DTO와 별개로 따로이 validator error 핸들링을 해둔다.
    if (Object.keys(req.body).length === 0 && !fileLinks) {
      throw new CustomError(400, 'NO_CONTENT');
    }

    // FeedStatus id 2 is 'temporary'
    feedInfo.status = 2;

    const result = await this.feedsService.createFeed(feedInfo, fileLinks, {
      isTemp: true,
    });

    res
      .status(201)
      .json({ message: `create temporary feed success`, result: result });
  };

  // 게시글 임시저장 수정 -----------------------------------------------------------
  updateTempFeed = async (req: Request, res: Response): Promise<void> => {
    const user: number = req.userInfo.id;
    const feedId: number = req.body.feedId;
    const { title, content, estimation, category }: TempFeedDto = req.body;
    const fileLinks: string[] = req.body.fileLinks;

    const feedInfo: TempFeedDto = {
      user,
      title,
      content,
      estimation,
      category,
    };

    const result: Feed = await this.feedsService.updateFeed(
      user,
      feedInfo,
      feedId,
      fileLinks,
      { isTemp: true }
    );

    res
      .status(200)
      .json({ message: `update temporary feed success`, result: result });
  };

  // 게시글 ==================================================================
  // 게시글 작성 --------------------------------------------------------------
  createFeed = async (req: Request, res: Response): Promise<void> => {
    const user: number = req.userInfo.id;
    const fileLinks: string[] = req.body.fileLinks;
    const { title, content, estimation, category }: FeedDto = req.body;
    const feedId: number = req.body.feedId;

    const feedInfo: FeedDto = {
      user,
      title,
      content,
      estimation,
      category,
    };

    // FeedStatus id 1 is 'posted'
    feedInfo.status = 1;

    let result: Feed;

    // 임시저장 게시글을 게시글로 등록할 때
    if (feedId) {
      result = await this.feedsService.updateFeed(
        user,
        feedInfo,
        feedId,
        fileLinks,
        {
          isTemp: true,
        }
      );
    } else {
      // 임시저장되지 않은 게시글을 등록할 때 (새로 작성)
      result = await this.feedsService.createFeed(feedInfo, fileLinks);
    }

    res.status(201).json({ message: `create feed success`, result: result });
  };

  // 게시글 수정 --------------------------------------------------------------
  updateFeed = async (req: Request, res: Response): Promise<void> => {
    const user = req.userInfo.id;
    const feedId: number = req.body.feedId;
    const fileLinks: string[] = req.body.fileLinks;
    const { title, content, estimation, category }: FeedDto = req.body;

    const feedInfo: FeedDto = {
      user,
      title,
      content,
      estimation,
      category,
    };

    const result: Feed = await this.feedsService.updateFeed(
      user,
      feedInfo,
      feedId,
      fileLinks
    );

    res.status(200).json({ message: `update feed success`, result: result });
  };

  deleteFeed = async (req: Request, res: Response): Promise<void> => {
    const userId: number = req.userInfo.id;
    const feedId: number = Number(req.params.feedId);

    await this.feedsService.deleteFeed(userId, feedId);

    res.status(200).json({ message: `delete feed success` });
  };

  // 게시글 리스트 ------------------------------------------------------------
  getFeedList = async (req: Request, res: Response): Promise<void> => {
    const categoryId: number = Number(req.query.categoryId);

    const startIndex: number = Number(req.query.index);
    const limit: number = Number(req.query.limit);
    const page: Pagination = { startIndex, limit };

    const result: FeedList[] = await this.feedsService.getFeedList(
      categoryId,
      page
    );

    res.status(200).json(result);
  };

  getEstimations = async (_req: Request, res: Response): Promise<void> => {
    const result: Estimation[] = await this.feedsService.getEstimations();

    res.status(200).json(result);
  };
}

export default new FeedsController(createFeedsService());
