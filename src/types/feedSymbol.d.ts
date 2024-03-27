import { FeedSymbol } from '../entities/feedSymbol.entity';

interface AddAndUpdateSymbolToFeedResult {
  statusCode: number;
  message: string;
  result: FeedSymbolCount[];
}

interface RemoveSymbolToFeedResult {
  message: string;
  result: FeedSymbolCount[];
}

interface CheckSymbolResult {
  checkValue: boolean;
  result: FeedSymbol | null;
}
