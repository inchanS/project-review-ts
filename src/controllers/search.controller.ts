import { Request, Response } from 'express';
import searchService from '../services/search.service';

const searchContent = async (req: Request, res: Response) => {
  const query: string = req.query.query as string;
  const limit: number = Number(req.query.limit);
  const index: number = Number(req.query.index);
  const result = await searchService.searchContent(query, index, limit);

  res.status(200).json(result);
};

export default { searchContent };
