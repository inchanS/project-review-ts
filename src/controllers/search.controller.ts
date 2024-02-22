import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';
import { ExtendedFeedlist } from '../types/feedList';

class SearchController {
  constructor(private searchService: SearchService) {}

  searchContent = async (req: Request, res: Response): Promise<void> => {
    const query: string = req.query.query as string;
    const limit: number = Number(req.query.limit);
    const index: number = Number(req.query.index);
    const result = await this.searchService.searchContent(query, index, limit);

    res.status(200).json(result);
  };

  searchContentList = async (req: Request, res: Response): Promise<void> => {
    const query: string = req.query.query as string;
    const limit: number = Number(req.query.limit);
    const index: number = Number(req.query.index);

    const result: ExtendedFeedlist[] =
      await this.searchService.searchContentList(query, index, limit);

    res.status(200).json(result);
  };
}

export default new SearchController(new SearchService());
