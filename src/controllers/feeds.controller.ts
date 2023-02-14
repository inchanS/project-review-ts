import { Request, Response } from 'express';
import feedsService from '../services/feeds.service';
import { FeedDto } from '../entities/dto/feed.dto';

const createFeed = async (req: Request, res: Response) => {
  const { title, content, estimation, category, status }: FeedDto = req.body;
  const user = req.userInfo.id;
  const feedInfo: FeedDto = {
    user,
    title,
    content,
    estimation,
    category,
    status,
  };

  await feedsService.createFeed(feedInfo);

  res.status(200).json({ message: `create feed success` });
};

const getFeedList = async (req: Request, res: Response) => {
  const categoryId: number = Number(req.query.categoryId);
  console.log('🔥feeds.controller/getFeedList:24- categoryId = ', categoryId);

  const page: number = Number(req.query.page);
  const result = await feedsService.getFeedList(categoryId, page);

  res.status(200).json(result);
};

export default { createFeed, getFeedList };
