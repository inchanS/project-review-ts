import { UserDto } from '../../entities/dto/user.dto';
import bcrypt from 'bcryptjs';
import dataSource from '../../repositories/data-source';
import { FeedSymbol } from '../../entities/feedSymbol.entity';
import { User } from '../../entities/users.entity';
import { Feed } from '../../entities/feed.entity';
import { Comment } from '../../entities/comment.entity';
import { UserContentService } from './userContent.service';
import { UploadFileService } from '../uploadFile.service';
import { ValidatorService } from './validator.service';
import { UserRepository } from '../../repositories/user.repository';
import { FeedSymbolRepository } from '../../repositories/feedSymbol.repository';
import { CustomError } from '../../utils/util';
import { QueryRunner } from 'typeorm';
import { CommentListByUserId, FeedListByUserId } from '../../types/user';

// 사용자 정보 수정, 삭제와 관련한 서비스
export class UserService {
  private userRepository: UserRepository;
  private feedSymbolRepository: FeedSymbolRepository;
  private uploadFileService: UploadFileService;
  private userContentService: UserContentService;
  private validatorService: ValidatorService;

  constructor() {
    this.userRepository = UserRepository.getInstance();
    this.feedSymbolRepository = FeedSymbolRepository.getInstance();
    this.uploadFileService = new UploadFileService();
    this.userContentService = new UserContentService();
    this.validatorService = new ValidatorService();
  }

  public updateUserInfo = async (
    userId: number,
    userInfo: UserDto
  ): Promise<User> => {
    const originUserInfo: User = await this.userRepository.findOneOrFail({
      where: { id: userId },
    });

    if (!originUserInfo) {
      throw new CustomError(404, 'NOT_FOUND_USER');
    }

    if (
      userInfo.nickname === originUserInfo.nickname &&
      userInfo.email === originUserInfo.email &&
      !userInfo.password
    ) {
      throw new CustomError(400, 'NO_CHANGE');
    }

    if (
      userInfo.nickname &&
      userInfo.nickname !== originUserInfo.nickname &&
      !userInfo.password
    ) {
      await this.validatorService.checkDuplicateNickname(userInfo.nickname);
    }

    if (userInfo.email && userInfo.email !== originUserInfo.email) {
      await this.validatorService.checkDuplicateEmail(userInfo.email);
    }

    if (userInfo.password) {
      const salt = await bcrypt.genSalt();
      userInfo.password = await bcrypt.hash(userInfo.password, salt);
    }

    await this.userRepository.update(userId, userInfo);
    return await this.userRepository.findOneOrFail({
      where: { id: userId },
    });
  };

  public deleteUser = async (userId: number): Promise<void> => {
    // 사용자 정보의 유효성 검사 함수를 불러온다.
    // 현재 아래 함수는 미들웨어 validateOrReject()에서 토큰의 현재 시점에 대한 유효성 검사를 위해 실행되고 있으나,
    // 사용자 정보를 가져오기 위해 한번 더 중복 실행되고 있는 상태이다.
    const userInfo: User = await this.validatorService.validateUserInfo(userId);

    const page: Pagination | undefined = undefined;

    // 사용자의 모든 게시글을 불러온다.
    const userFeedsInfo: FeedListByUserId =
      await this.userContentService.findUserFeedsByUserId(userId, page, {
        includeTempFeeds: true,
      });

    // 사용자의 모든 덧글을 불러온다.
    const userCommentsInfo: CommentListByUserId =
      await this.userContentService.findUserCommentsByUserId(
        userId,
        userId,
        page
      );

    // 사용자의 모든 좋아요 정보를 불러온다.
    const userSymbols: FeedSymbol[] =
      await this.feedSymbolRepository.findByUserId(userId);

    // transaction을 시작한다.
    const queryRunner: QueryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userFeedIds: number[] = userFeedsInfo.feedListByUserId.map(
        (feed: { id: number }) => feed.id
      );
      const userCommentIds: number[] = userCommentsInfo.commentListByUserId.map(
        (comment: { id: number }) => comment.id
      );
      const userSymbolIds: number[] = userSymbols.map(
        (symbol: FeedSymbol) => symbol.id
      );

      // 사용자의 email을 변경한다. 추후 해당 email의 재사용을 위한 고민중 230607 수정
      const email: string = `${userInfo.email}.deleted.${Date.now()}`;
      const nickname: string = `${userInfo.nickname}.deleted.${Date.now()}`;
      // 객체 리터럴 단축구문으로 email과 nickname의 변경내용을 간략하게 표현한다. (230607 수정, 20240215 nickname 추가)
      await queryRunner.manager.update(User, userId, { email, nickname });

      // 사용자의 User entity를 삭제한다.
      await queryRunner.manager.softDelete(User, userId);

      // 사용자의 Feed entity를 모두 삭제한다.
      if (userFeedIds.length > 0) {
        await queryRunner.manager.update(Feed, userFeedIds, {
          status: { id: 3 },
        });
        await queryRunner.manager.softDelete(Feed, userFeedIds);
      }
      // feed를 모두 삭제한 후, 사용하지 않는 fileLinks를 삭제한다.

      const unusedFileLinks: DeleteUploadFiles | undefined =
        await this.uploadFileService.deleteUnusedUploadFiles(
          queryRunner,
          userId
        );

      if (unusedFileLinks) {
        await this.uploadFileService.deleteUnconnectedLinks(
          queryRunner,
          unusedFileLinks.uploadFileWithoutFeedId,
          unusedFileLinks.deleteFileLinksArray,
          userId
        );
      }

      // 사용자의 덧글을 모두 삭제한다.
      if (userCommentIds.length > 0) {
        await queryRunner.manager.softDelete(Comment, userCommentIds);
      }
      // 사용자의 symbol을 모두 삭제한다.
      if (userSymbolIds.length > 0) {
        await queryRunner.manager.softDelete(FeedSymbol, userSymbolIds);
      }
      // transaction commit
      await queryRunner.commitTransaction();
      return;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  };
}
