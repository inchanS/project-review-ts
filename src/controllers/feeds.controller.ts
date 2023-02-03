import { Request, Response } from 'express';
import { Feed } from '../entities/feed.entity';
import feedsService from '../services/feeds.service';

// TODO createdFeed => S3 연결해서 다시 작성하기
const createFeed = async (req: Request, res: Response) => {
  const { userId, title, content, estimationId, categoryId, statusId }: Feed =
    req.body;
  const feedInfo: Feed = {
    userId,
    title,
    content,
    estimationId,
    categoryId,
    statusId,
  };

  await feedsService.createFeed(feedInfo);

  res.status(200).json({ message: `create feed success` });
};

const getFeedList = async (req: Request, res: Response) => {
  const page: number = Number(req.query.page);
  const result = await feedsService.getFeedList(page);

  res.status(200).json(result);
};

export default { createFeed, getFeedList };
