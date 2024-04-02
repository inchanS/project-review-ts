import { ValidatorService } from '../services/users/validator.service';
import { AuthService } from '../services/users/auth.service';
import { UserService } from '../services/users/user.service';
import { UploadFileService } from '../services/uploadFile.service';
import { UserContentService } from '../services/users/userContent.service';
import { UserCustomRepository } from '../repositories/user.customRepository';
import { CategoriesService } from '../services/categories.service';
import { CommentsService } from '../services/comments.service';
import { FeedsService } from '../services/feeds.service';
import { UploadService } from '../services/upload.service';
import { SearchService } from '../services/search.service';
import { SymbolService } from '../services/symbol.service';
import { Repository } from 'typeorm';
import dataSource from '../repositories/data-source';
import { UploadFiles } from '../entities/uploadFiles.entity';
import { CommentCustomRepository } from '../repositories/comment.customRepository';
import { FeedCustomRepository } from '../repositories/feed.customRepository';
import { FeedSymbolCustomRepository } from '../repositories/feedSymbol.customRepository';
import { FeedListCustomRepository } from '../repositories/feedList.customRepository';
import { User } from '../entities/users.entity';
import { Category } from '../entities/category.entity';
import { Feed } from '../entities/feed.entity';
import { Comment } from '../entities/comment.entity';

export function createAuthService(): AuthService {
  const validatorService: ValidatorService = createValidateService();
  const userCustomRepository: UserCustomRepository = new UserCustomRepository(
    dataSource
  );
  const userRepository: Repository<User> = dataSource.getRepository(User);

  return new AuthService(
    validatorService,
    userCustomRepository,
    userRepository
  );
}

export function createUserService(): UserService {
  const uploadFileService: UploadFileService = createUploadFileService();
  const userContentService: UserContentService = createUserContentService();
  const validatorService: ValidatorService = createValidateService();
  const userRepository: Repository<User> = dataSource.getRepository(User);
  return new UserService(
    new FeedSymbolCustomRepository(dataSource),
    uploadFileService,
    userContentService,
    validatorService,
    userRepository
  );
}

export function createUserContentService(): UserContentService {
  return new UserContentService(
    new FeedCustomRepository(dataSource),
    new FeedListCustomRepository(dataSource),
    new CommentCustomRepository(dataSource),
    new FeedSymbolCustomRepository(dataSource)
  );
}

export function createValidateService(): ValidatorService {
  const userCustomRepository: UserCustomRepository = new UserCustomRepository(
    dataSource
  );
  const userRepository: Repository<User> = dataSource.getRepository(User);
  return new ValidatorService(userCustomRepository, userRepository);
}

export function createCategoriesService(): CategoriesService {
  const categoryRepository: Repository<Category> =
    dataSource.getRepository(Category);
  return new CategoriesService(categoryRepository);
}

export function createCommentsService(): CommentsService {
  const commentCustomRepository: CommentCustomRepository =
    new CommentCustomRepository(dataSource);
  const feedRepository: Repository<Feed> = dataSource.getRepository(Feed);
  const commentRepository: Repository<Comment> =
    dataSource.getRepository(Comment);
  return new CommentsService(
    commentCustomRepository,
    feedRepository,
    commentRepository
  );
}

export function createFeedsService(): FeedsService {
  const uploadFileService: UploadFileService = createUploadFileService();
  const uploadService: UploadService = createUploadService();
  return new FeedsService(
    new FeedCustomRepository(dataSource),
    new FeedListCustomRepository(dataSource),
    uploadFileService,
    uploadService
  );
}

export function createSearchService(): SearchService {
  const feedListCustomRepository: FeedListCustomRepository =
    new FeedListCustomRepository(dataSource);
  const feedRepository: Repository<Feed> = dataSource.getRepository(Feed);
  return new SearchService(feedListCustomRepository, feedRepository);
}

export function createSymbolService(): SymbolService {
  return new SymbolService(
    new FeedCustomRepository(dataSource),
    new FeedSymbolCustomRepository(dataSource)
  );
}

export function createUploadService(): UploadService {
  const uploadFilesRepository: Repository<UploadFiles> =
    dataSource.getRepository(UploadFiles);
  return new UploadService(uploadFilesRepository);
}

export function createUploadFileService(): UploadFileService {
  const uploadService: UploadService = createUploadService();
  return new UploadFileService(uploadService);
}
