import { FeedList } from '../entities/viewEntities/viewFeedList.entity';

interface ExtendedFeedlist
  extends Omit<FeedList, 'createdAt' | 'updatedAt' | 'postedAt' | 'deletedAt'> {
  createdAt: string;
  updatedAt: string;
  postedAt: string | null;
  deletedAt: string | null;
}
interface FeedListOptions {
  includeTempFeeds?: boolean;
  onlyTempFeeds?: boolean;
}
interface Pagination {
  startIndex: number;
  limit: number;
}

interface PageCondition {
  skip: number;
  take: number;
}
