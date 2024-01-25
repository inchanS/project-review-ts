import { Request, Response, Router } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { CommentRepository } from '../repositories/comment.repository';
import { FeedRepository } from '../repositories/feed.repository';
import { FeedListRepository } from '../repositories/feedList.repository';
import { FeedSymbolRepository } from '../repositories/feedSymbol.repository';

const router = Router();

// 레포지토리의 단일인스턴스 확인 함수
function isSingleton<T>(repository: { getInstance(): T }): string {
  const instance1 = repository.getInstance();
  const instance2 = repository.getInstance();
  return `only instance is ${instance1 === instance2}`;
}

router.get('/singletons', (req: Request, res: Response) => {
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
