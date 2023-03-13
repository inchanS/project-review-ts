import { FeedSymbol } from '../entities/feedSymbol.entity';

export interface AddAndUpdateSymbolToFeedResult {
  sort: 'add' | 'update';
  result: any;
}
export interface CheckSymbolResult {
  checkValue: boolean;
  result: FeedSymbol | null;
}
