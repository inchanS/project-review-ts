import { FeedSymbol } from '../entities/feedSymbol.entity';

interface AddAndUpdateSymbolToFeedResult {
  sort: 'add' | 'update';
  result: any;
}
interface CheckSymbolResult {
  checkValue: boolean;
  result: FeedSymbol | null;
}
