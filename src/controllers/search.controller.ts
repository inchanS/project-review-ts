import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import { createSearchService } from '../utils/serviceFactory';

class SearchController {
  constructor(private searchService: SearchService) {}

  searchContent = async (req: Request, res: Response): Promise<void> => {
    const query: string = req.query.query as string;
    const limit: number = Number(req.query.limit);
    const index: number = Number(req.query.index);

    const page: Pagination = { startIndex: index, limit: limit };
    const result = await this.searchService.searchContent(query, page);

    res.status(200).json(result);
  };

  searchContentList = async (req: Request, res: Response): Promise<void> => {
    const query: string = req.query.query as string;
    const limit: number = Number(req.query.limit);
    const startIndex: number = Number(req.query.index);

    const page: Pagination = { startIndex, limit };
    const result: FeedList[] = await this.searchService.searchContentList(
      query,
      page
    );

    res.status(200).json(result);
  };
}

export default new SearchController(createSearchService());
