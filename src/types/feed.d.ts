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
