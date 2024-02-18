import { Request, Response, Router } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { CommentRepository } from '../repositories/comment.repository';
import { FeedRepository } from '../repositories/feed.repository';
import { FeedListRepository } from '../repositories/feedList.repository';
import { FeedSymbolRepository } from '../repositories/feedSymbol.repository';

const router: Router = Router();

// 레포지토리의 단일인스턴스 확인 함수
function isSingleton<T>(repository: { getInstance(): T }): string {
  const instance1: T = repository.getInstance();
  const instance2: T = repository.getInstance();
  const isInstanceEquel: boolean = instance1 === instance2;
  const message: string = 'only instance is ';
  const result: string = message + isInstanceEquel;

  return result;
}

router.get('/singletons', (_req: Request, res: Response) => {
  const testUserRepository = isSingleton(UserRepository);
  const testFeedRepository = isSingleton(FeedRepository);
  const testFeedListRepository = isSingleton(FeedListRepository);
  const testCommentRepository = isSingleton(CommentRepository);
  const testFeedsymbolRepository = isSingleton(FeedSymbolRepository);

  res.status(200).json({
    testUserRepository,
    testFeedRepository,
    testFeedListRepository,
    testCommentRepository,
    testFeedsymbolRepository,
  });
});

export default router;
