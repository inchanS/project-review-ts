import { Feed } from '../entities/feed.entity';

interface FeedOption {
  isTemp?: boolean;
  isAll?: boolean;
}

interface FeedSymbolCount {
  feedId: number;
  symbolId: number;
  symbol: string;
  count: number;
}

interface ExtendedFeed
  extends Omit<Feed, 'created_at' | 'updated_at' | 'posted_at'> {
  created_at: string;
  updated_at: string;
  posted_at: string | null;
}
