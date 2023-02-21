import { Request, Response } from 'express';
import feedsService from '../services/feeds.service';
import { FeedDto } from '../entities/dto/feed.dto';
import { TempFeedDto } from '../entities/dto/tempFeed.dto';

// 임시저장 ------------------------------------------------
const getTempFeedList = async (req: Request, res: Response) => {
  const user = req.userInfo.id;
  const result = await feedsService.getTempFeedList(user);

  res.status(200).json({ message: `check temporary feed success`, result });
};
const createTempFeed = async (req: Request, res: Response) => {
  const user = req.userInfo.id;
  const { title, content, estimation, category }: TempFeedDto = req.body;
  const file_link: string = req.body.file_link;

  const feedInfo: TempFeedDto = {
    user,
    title,
    content,
    estimation,
    category,
  };

  const result = await feedsService.createTempFeed(feedInfo, file_link);

  res
    .status(200)
    .json({ message: `create temporary feed success`, result: result });
};

const updateTempFeed = async (req: Request, res: Response) => {
  const user = req.userInfo.id;
  const feedId: number = req.body.feedId;
  const { title, content, estimation, category }: TempFeedDto = req.body;
  const file_link: string = req.body.file_link;

  const feedInfo: TempFeedDto = {
    user,
    title,
    content,
    estimation,
    category,
  };

  const result = await feedsService.updateTempFeed(feedId, feedInfo, file_link);

  res
    .status(200)
    .json({ message: `update temporary feed success`, result: result });
};

// 게시글 ------------------------------------------------
const createFeed = async (req: Request, res: Response) => {
  const user = req.userInfo.id;
  const file_link: string = req.body.file_link;
  const { title, content, estimation, category, status }: FeedDto = req.body;
  const feedInfo: FeedDto = {
    user,
    title,
    content,
    estimation,
    category,
    status,
  };

  const result = await feedsService.createFeed(feedInfo, file_link);

  res.status(200).json({ message: `create feed success`, result: result });
};

const getFeedList = async (req: Request, res: Response) => {
  const categoryId: number = Number(req.query.categoryId);

  const page: number = Number(req.query.page);
  const result = await feedsService.getFeedList(categoryId, page);

  res.status(200).json(result);
};

export default {
  createFeed,
  getFeedList,
  createTempFeed,
  getTempFeedList,
  updateTempFeed,
};
