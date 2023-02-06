import { Request, Response } from 'express';
import feedsService from '../services/feeds.service';
import { FeedDto } from '../entities/dto/feed.dto';

// TODO createdFeed => S3 연결해서 다시 작성하기
const createFeed = async (req: Request, res: Response) => {
  const { user, title, content, estimation, category, status }: FeedDto =
    req.body;
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
  const page: number = Number(req.query.page);
  const result = await feedsService.getFeedList(page);

  res.status(200).json(result);
};

export default { createFeed, getFeedList };
