import { Request, Response } from 'express';
import { FeedSymbolDto } from '../entities/dto/feedSymbol.dto';
import {
  CheckSymbolResult,
  AddAndUpdateSymbolToFeedResult,
  RemoveSymbolToFeedResult,
} from '../types/feedSymbol';
import { SymbolService } from '../services/symbol.service';
import { Symbol } from '../entities/symbol.entity';

class SymbolsController {
  constructor(private symbolService: SymbolService) {}

  getSymbols = async (_req: Request, res: Response): Promise<void> => {
    const result: Symbol[] = await this.symbolService.getSymbols();
    res.status(200).json(result);
  };

  getFeedSymbolCount = async (req: Request, res: Response): Promise<void> => {
    const feedId: number = Number(req.params.feedId);

    const result = await this.symbolService.getFeedSymbolCount(feedId);
    res.status(200).json(result);
  };

  checkUsersSymbolForFeed = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const feedId: number = Number(req.params.feedId);
    const userId: number = req.userInfo.id;

    const result: CheckSymbolResult =
      await this.symbolService.checkUsersSymbolForFeed(feedId, userId);
    res.status(200).json(result);
  };

  addAndUpdateSymbolToFeed = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const userId: number = req.userInfo.id;
    const feedId: number = Number(req.params.feedId);
    const { symbolId } = req.body;

    const feedSymbolInfo: FeedSymbolDto = {
      user: userId,
      feed: feedId,
      symbol: symbolId,
    };

    const result: AddAndUpdateSymbolToFeedResult =
      await this.symbolService.addAndUpdateSymbolToFeed(feedSymbolInfo);

    res
      .status(result.statusCode)
      .json({ message: result.message, result: result.result });
  };

  removeSymbolFromFeed = async (req: Request, res: Response): Promise<void> => {
    const userId: number = req.userInfo.id;
    const feedId: number = Number(req.params.feedId);

    const result: RemoveSymbolToFeedResult =
      await this.symbolService.removeSymbolFromFeed(userId, feedId);

    res.status(200).json(result);
  };
}

export default new SymbolsController(new SymbolService());
