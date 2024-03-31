import { ValidatorService } from '../services/users/validator.service';
import { AuthService } from '../services/users/auth.service';
import { UserService } from '../services/users/user.service';
import { UploadFileService } from '../services/uploadFile.service';
import { UserContentService } from '../services/users/userContent.service';
import { UserRepository } from '../repositories/user.repository';
import { FeedSymbolRepository } from '../repositories/feedSymbol.repository';
import { FeedRepository } from '../repositories/feed.repository';
import { FeedListRepository } from '../repositories/feedList.repository';
import { CommentRepository } from '../repositories/comment.repository';
import { CategoriesService } from '../services/categories.service';
import { CategoriesRepository } from '../repositories/categories.repository';
import { CommentsService } from '../services/comments.service';
import { FeedsService } from '../services/feeds.service';
import { UploadService } from '../services/upload.service';
import { SearchService } from '../services/search.service';
import { SymbolService } from '../services/symbol.service';
import { UploadFilesRepository } from '../repositories/uploadFiles.repository';

export function createAuthService(): AuthService {
  const validatorService: ValidatorService = createValidateService();
  const userRepository: UserRepository = UserRepository.getInstance();
  return new AuthService(validatorService, userRepository);
}

export function createUserService(): UserService {
  const userRepository: UserRepository = UserRepository.getInstance();
  const feedSymbolRepository: FeedSymbolRepository =
    FeedSymbolRepository.getInstance();
  const uploadFileService: UploadFileService = createUploadFileService();
  const userContentService: UserContentService = createUserContentService();
  const validatorService: ValidatorService = createValidateService();
  return new UserService(
    userRepository,
    feedSymbolRepository,
    uploadFileService,
    userContentService,
    validatorService
  );
}

export function createUserContentService(): UserContentService {
  const feedRepository: FeedRepository = FeedRepository.getInstance();
  const feedListRepository: FeedListRepository =
    FeedListRepository.getInstance();
  const commentRepository: CommentRepository = CommentRepository.getInstance();
  const feedSymbolRepository: FeedSymbolRepository =
    FeedSymbolRepository.getInstance();
  return new UserContentService(
    feedRepository,
    feedListRepository,
    commentRepository,
    feedSymbolRepository
  );
}

export function createValidateService(): ValidatorService {
  const userRepository: UserRepository = UserRepository.getInstance();
  return new ValidatorService(userRepository);
}

export function createCategoriesService(): CategoriesService {
  const categoriesRepository: CategoriesRepository =
    CategoriesRepository.getInstance();
  return new CategoriesService(categoriesRepository);
}

export function createCommentsService(): CommentsService {
  const feedRepository: FeedRepository = FeedRepository.getInstance();
  const commentRepository: CommentRepository = CommentRepository.getInstance();
  return new CommentsService(feedRepository, commentRepository);
}

export function createFeedsService(): FeedsService {
  const feedRepository: FeedRepository = FeedRepository.getInstance();
  const feedListRepository: FeedListRepository =
    FeedListRepository.getInstance();
  const uploadFileService: UploadFileService = createUploadFileService();
  const uploadService: UploadService = createUploadService();
  return new FeedsService(
    feedRepository,
    feedListRepository,
    uploadFileService,
    uploadService
  );
}

export function createSearchService(): SearchService {
  const feedRepository: FeedRepository = FeedRepository.getInstance();
  const feedListRepository: FeedListRepository =
    FeedListRepository.getInstance();
  return new SearchService(feedRepository, feedListRepository);
}

export function createSymbolService(): SymbolService {
  const feedRepository: FeedRepository = FeedRepository.getInstance();
  const feedSymbolRepository: FeedSymbolRepository =
    FeedSymbolRepository.getInstance();
  return new SymbolService(feedRepository, feedSymbolRepository);
}

export function createUploadService(): UploadService {
  const uploadFilesRepository: UploadFilesRepository =
    UploadFilesRepository.getInstance();
  return new UploadService(uploadFilesRepository);
}

export function createUploadFileService(): UploadFileService {
  const uploadService: UploadService = createUploadService();
  return new UploadFileService(uploadService);
}
