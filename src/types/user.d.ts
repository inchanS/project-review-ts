import { FeedSymbol } from '../entities/feedSymbol.entity';
import { Comment } from '../entities/comment.entity';

interface FeedListByUserId {
  feedCntByUserId: number;
  totalPage: number;
  feedListByUserId: Feedlist[];
}

interface CommentListByUserId {
  commentCntByUserId: number;
  totalScrollCnt: number;
  commentListByUserId: Comment[];
}

interface FeedSymbolListByUserId {
  symbolCntByUserId: number;
  totalPage: number;
  symbolListByUserId: FeedSymbol[];
}
