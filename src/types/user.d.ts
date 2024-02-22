import { ExtendedComment } from '../services/comments.service';
import { FeedSymbol } from '../entities/feedSymbol.entity';
import { ExtendedFeedlist } from './feedList';

interface FeedListByUserId {
  feedCntByUserId: number;
  totalPage: number;
  feedListByUserId: ExtendedFeedlist[];
}

interface CommentListByUserId {
  commentCntByUserId: number;
  totalScrollCnt: number;
  commentListByUserId: ExtendedComment[];
}

interface FeedSymbolListByUserId {
  symbolCntByUserId: number;
  totalPage: number;
  symbolListByUserId: FeedSymbol[];
}
