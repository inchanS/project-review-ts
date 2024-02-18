import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import { ExtendedComment } from '../services/comments.service';
import { FeedSymbol } from '../entities/feedSymbol.entity';

interface FeedListByUserId {
  feedCntByUserId: number;
  totalPage: number;
  feedListByUserId: FeedList[];
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
