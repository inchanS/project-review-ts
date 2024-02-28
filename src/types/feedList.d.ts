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
