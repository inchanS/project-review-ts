import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';

class SearchController {
  private searchService: SearchService;

  constructor() {
    this.searchService = new SearchService();
  }

  searchContent = async (req: Request, res: Response) => {
    const query: string = req.query.query as string;
    const limit: number = Number(req.query.limit);
    const index: number = Number(req.query.index);
    const result = await this.searchService.searchContent(query, index, limit);

    res.status(200).json(result);
  };

  searchContentList = async (req: Request, res: Response) => {
    const query: string = req.query.query as string;
    const limit: number = Number(req.query.limit);
    const index: number = Number(req.query.index);
    const result = await this.searchService.searchContentList(
      query,
      index,
      limit
    );

    res.status(200).json(result);
  };
}

export default new SearchController();
