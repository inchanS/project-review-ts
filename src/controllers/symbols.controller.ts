import { Request, Response } from 'express';
import { FeedSymbolDto } from '../entities/dto/feedSymbol.dto';
import {
  AddAndUpdateSymbolToFeedResult,
  CheckSymbolResult,
} from '../types/feedSymbol';
import { SymbolService } from '../services/symbol.service';
import { Symbol } from '../entities/symbol.entity';

class SymbolsController {
  private symbolService: SymbolService;

  constructor() {
    this.symbolService = new SymbolService();
  }

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

    const addMessage: string = `SYMBOL_ID_${feedSymbolInfo.symbol}_HAS_BEEN_ADDED_TO_THE_FEED_ID_${feedSymbolInfo.feed}`;
    const updateMessage: string = `SYMBOL_ID_${feedSymbolInfo.symbol}_HAS_BEEN_UPDATED_TO_THE_FEED_ID_${feedSymbolInfo.feed}`;

    const result: AddAndUpdateSymbolToFeedResult =
      await this.symbolService.addAndUpdateSymbolToFeed(feedSymbolInfo);

    const isAdd: boolean = result.sort === 'add';
    const message: string = isAdd ? addMessage : updateMessage;
    const statusCode: 201 | 200 = isAdd ? 201 : 200;

    res.status(statusCode).json({ message, result: result.result });
  };

  removeSymbolFromFeed = async (req: Request, res: Response): Promise<void> => {
    const userId: number = req.userInfo.id;
    const feedId: number = Number(req.params.feedId);

    const result = await this.symbolService.removeSymbolFromFeed(
      userId,
      feedId
    );

    res.status(200).json(result);
  };
}

export default new SymbolsController();
