import { Request, Response } from 'express';
import searchService from '../services/search.service';

const searchContent = async (req: Request, res: Response) => {
  const query: string = req.query.query as string;
  const result = await searchService.searchContent(query);

  res.status(200).json(result);
};

export default { searchContent };
