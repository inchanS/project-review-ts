import { Request, Response } from 'express';
import feedsService from '../services/feeds.service';
import { FeedDto } from '../entities/dto/feed.dto';
import { TempFeedDto } from '../entities/dto/tempFeed.dto';

// 임시저장 ==================================================================
// 임시저장 게시글 리스트 --------------------------------------------------------
const getTempFeedList = async (req: Request, res: Response) => {
  const user = req.userInfo.id;
  const result = await feedsService.getTempFeedList(user);

  res.status(200).json({ message: `check temporary feed success`, result });
};

// 임시저장 게시글 불러오기 -----------------------------------------------------------
const getFeed = async (req: Request, res: Response) => {
  const user = req.userInfo.id;
  const feedId: number = Number(req.params.feedId);

  const result = await feedsService.getFeed(user, feedId);

  res.status(200).json({ message: `check feed success`, result });
};

// 게시글 임시저장 -----------------------------------------------------------
const createTempFeed = async (req: Request, res: Response) => {
  const user = req.userInfo.id;
  const { title, content, estimation, category }: TempFeedDto = req.body;
  const fileLinks: string[] = req.body.fileLinks;

  const feedInfo: TempFeedDto = {
    user,
    title,
    content,
    estimation,
    category,
  };

  if (Object.keys(req.body).length === 0 && !fileLinks) {
    const error = new Error('NO_CONTENT');
    error.status = 400;
    throw error;
  }

  // FeedStatus id 2 is 'temporary'
  feedInfo.status = 2;

  const result = await feedsService.createFeed(feedInfo, fileLinks);

  res
    .status(201)
    .json({ message: `create temporary feed success`, result: result });
};

// 게시글 임시저장 수정 -----------------------------------------------------------
const updateTempFeed = async (req: Request, res: Response) => {
  const user = req.userInfo.id;
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

  const result = await feedsService.updateFeed(
    user,
    feedInfo,
    feedId,
    fileLinks
  );

  res
    .status(200)
    .json({ message: `update temporary feed success`, result: result });
};

// TODO : 임시저장 게시글 삭제

// 게시글 ==================================================================
// 게시글 생성 --------------------------------------------------------------
const createFeed = async (req: Request, res: Response) => {
  const user = req.userInfo.id;
  const fileLinks: string[] = req.body.fileLinks;
  const { title, content, estimation, category }: FeedDto = req.body;

  const feedInfo: FeedDto = {
    user,
    title,
    content,
    estimation,
    category,
  };

  // FeedStatus id 1 is 'posted'
  feedInfo.status = 1;

  const result = await feedsService.createFeed(feedInfo, fileLinks);

  res.status(201).json({ message: `create feed success`, result: result });
};

// 게시글 수정 --------------------------------------------------------------
const updateFeed = async (req: Request, res: Response) => {
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

  const result = await feedsService.updateFeed(
    user,
    feedInfo,
    feedId,
    fileLinks
  );

  res.status(200).json({ message: `update feed success`, result: result });
};

// 게시글 리스트 ------------------------------------------------------------
const getFeedList = async (req: Request, res: Response) => {
  const categoryId: number = Number(req.query.categoryId);

  const page: number = Number(req.query.page);
  const limit: number = Number(req.query.limit);

  const result = await feedsService.getFeedList(categoryId, page, limit);

  res.status(200).json(result);
};

const getEstimations = async (req: Request, res: Response) => {
  const result = await feedsService.getEstimations();

  res.status(200).json(result);
};
export default {
  createFeed,
  updateFeed,
  getFeedList,
  createTempFeed,
  updateTempFeed,
  getTempFeedList,
  getFeed,
  getEstimations,
};
