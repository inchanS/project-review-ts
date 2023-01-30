import { Request, Response } from 'express';
import { Feed } from '../entities/feed.entity';
import feedsService from '../services/feeds.service';

const createFeed = async (req: Request, res: Response) => {
  const { user, title, content, estimation, category, status }: Feed = req.body;
  const feedInfo: Feed = { user, title, content, estimation, category, status };

  await feedsService.createFeed(feedInfo);

  res.status(200).json({ message: `create feed success` });
};

export default { createFeed };
