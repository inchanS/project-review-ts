import { Request, Response, Router } from 'express';
import { UserCustomRepository } from '../repositories/user.customRepository';
import { CommentCustomRepository } from '../repositories/comment.customRepository';
import { FeedCustomRepository } from '../repositories/feed.customRepository';
import { FeedListCustomRepository } from '../repositories/feedList.customRepository';
import { FeedSymbolCustomRepository } from '../repositories/feedSymbol.customRepository';

const router: Router = Router();

// 레포지토리의 단일인스턴스 확인 함수
function isInstanceValid<T>(repository: T): string {
  const isInstanceValid: boolean =
    repository !== undefined && repository !== null;
  return 'Instance is valid: ' + isInstanceValid;
}

router.get('/singletons', (_req: Request, res: Response) => {
  const testUserRepository: string = isInstanceValid(UserCustomRepository);
  const testFeedRepository: string = isInstanceValid(FeedCustomRepository);
  const testFeedListRepository: string = isInstanceValid(
    FeedListCustomRepository
  );
  const testCommentRepository: string = isInstanceValid(
    CommentCustomRepository
  );
  const testFeedsymbolRepository: string = isInstanceValid(
    FeedSymbolCustomRepository
  );

  res.status(200).json({
    testUserRepository,
    testFeedRepository,
    testFeedListRepository,
    testCommentRepository,
    testFeedsymbolRepository,
  });
});

export default router;
