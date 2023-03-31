import symbolService from '../services/symbol.service';
import { Request, Response } from 'express';
import { FeedSymbolDto } from '../entities/dto/feedSymbol.dto';
import { AddAndUpdateSymbolToFeedResult } from '../types/feedSymbol';

const getSymbols = async (req: Request, res: Response) => {
  const result = await symbolService.getSymbols();
  res.status(200).json(result);
};

const getFeedSymbolCount = async (req: Request, res: Response) => {
  const feedId: number = Number(req.params.feedId);

  const result = await symbolService.getFeedSymbolCount(feedId);
  res.status(200).json(result);
};

const checkUsersSymbolForfeed = async (req: Request, res: Response) => {
  const feedId: number = Number(req.params.feedId);
  const userId: number = req.userInfo.id;

  const result = await symbolService.checkUsersSymbolForfeed(feedId, userId);
  res.status(200).json(result);
};

const addAndUpdateSymbolToFeed = async (req: Request, res: Response) => {
  const userId: number = req.userInfo.id;
  const feedId: number = Number(req.params.feedId);
  const { symbolId } = req.body;

  const feedSymbolInfo: FeedSymbolDto = {
    user: userId,
    feed: feedId,
    symbol: symbolId,
  };

  const addMessage = `SYMBOL_ID_${feedSymbolInfo.symbol}_HAS_BEEN_ADDED_TO_THE_FEED_ID_${feedSymbolInfo.feed}`;
  const updateMessage = `SYMBOL_ID_${feedSymbolInfo.symbol}_HAS_BEEN_UPDATED_TO_THE_FEED_ID_${feedSymbolInfo.feed}`;

  const result: AddAndUpdateSymbolToFeedResult =
    await symbolService.addAndUpdateSymbolToFeed(feedSymbolInfo);

  const isAdd = result.sort === 'add';
  const message = isAdd ? addMessage : updateMessage;
  const statusCode = isAdd ? 201 : 200;

  res.status(statusCode).json({ message, result: result.result });
};

const removeSymbolFromFeed = async (req: Request, res: Response) => {
  const userId: number = req.userInfo.id;
  const feedId: number = Number(req.params.feedId);

  const result = await symbolService.removeSymbolFromFeed(userId, feedId);

  res.status(200).json(result);
};

export default {
  getSymbols,
  getFeedSymbolCount,
  addAndUpdateSymbolToFeed,
  removeSymbolFromFeed,
  checkUsersSymbolForfeed,
};
