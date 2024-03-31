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

export class UserService {
  private userRepository: UserRepository;
  private feedSymbolRepository: FeedSymbolRepository;
  private uploadFileService: UploadFileService;
  private userContentService: UserContentService;
  private validatorService: ValidatorService;

  constructor(
    userRepository: UserRepository,
    feedSymbolRepository: FeedSymbolRepository,
    uploadFileservice: UploadFileService,
    userContentService: UserContentService,
    validatorService: ValidatorService
  ) {
    this.userRepository = userRepository;
    this.feedSymbolRepository = feedSymbolRepository;
    this.uploadFileService = uploadFileservice;
    this.userContentService = userContentService;
    this.validatorService = validatorService;
  }

  public updateUserInfo = async (
    userId: number,
    newUserInfo: UserDto
  ): Promise<User> => {
    // 사용자 검증
    const existingUser: User | null = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new CustomError(404, 'NOT_FOUND_USER');
    }

    // 변경내용 검증: 이메일 및 닉네임 중복검사
    const isNicknameUnchanged: boolean =
      newUserInfo.nickname === existingUser.nickname;
    const isEmailUnchanged: boolean = newUserInfo.email === existingUser.email;

    // 변경내용이 없으면 에러 반환
    if (isNicknameUnchanged && isEmailUnchanged && !newUserInfo.password) {
      throw new CustomError(400, 'NO_CHANGE');
    }

    // 변경사항이 있을 때 Unique 항목에 대한 유효성 검사
    if (newUserInfo.nickname && !isNicknameUnchanged) {
      await this.validatorService.checkDuplicateNickname(newUserInfo.nickname);
    }
    if (newUserInfo.email && !isEmailUnchanged) {
      await this.validatorService.checkDuplicateEmail(newUserInfo.email);
    }

    if (newUserInfo.password) {
      const salt: string = await bcrypt.genSalt();
      newUserInfo.password = await bcrypt.hash(newUserInfo.password, salt);
    }

    // 변경사항 업데이트
    await this.userRepository.update(userId, newUserInfo);
    return this.userRepository.findOneOrFail({
      where: { id: userId },
    });
  };

  public deleteUser = async (userId: number): Promise<void> => {
    // 사용자 정보의 유효성 검사 함수를 불러온다.
    // 현재 아래 함수는 미들웨어 validateOrReject()에서 토큰의 현재 시점에 대한 유효성 검사를 위해 실행되고 있으나,
    // 사용자 정보를 가져오기 위해 한번 더 중복 실행되고 있는 상태이다.

    // 사용자 검증, 게시글, 덧글, 좋아요 정보 불러오기를 동시에 처리한다.
    const [userInfo, userFeedsInfo, userCommentsInfo, userSymbols]: [
      User,
      FeedListByUserId,
      CommentListByUserId,
      FeedSymbol[]
    ] = await Promise.all([
      this.validatorService.validateUserInfo(userId),
      this.userContentService.findUserFeedsByUserId(userId, undefined, {
        includeTempFeeds: true,
      }),
      this.userContentService.findUserCommentsByUserId(userId, userId),
      this.feedSymbolRepository.findByUserId(userId),
    ]);

    const queryRunner: QueryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 이메일 및 닉네임 업데이트
      const timestamp: number = Date.now();
      await queryRunner.manager.update(User, userId, {
        email: `${userInfo.email}.deleted.${timestamp}`,
        nickname: `${userInfo.nickname}.deleted.${timestamp}`,
      });

      // 삭제할 사용자 관련 Entity 삭제 로직
      await this.deleteUserFeeds(queryRunner, userFeedsInfo);
      await this.deleteUserUploadFiles(queryRunner, userId);
      await this.deleteUserComments(queryRunner, userCommentsInfo);
      await this.deleteUserSymbols(queryRunner, userSymbols);
      // 사용자의 User entity를 삭제한다.
      await queryRunner.manager.softDelete(User, userId);

      await queryRunner.commitTransaction();
      return;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  };

  private deleteUserFeeds = async (
    queryRunner: QueryRunner,
    userFeedsInfo: FeedListByUserId
  ): Promise<void> => {
    const userFeedIds: number[] = userFeedsInfo.feedListByUserId.map(
      (feed: { id: number }) => feed.id
    );
    if (userFeedIds.length > 0) {
      await queryRunner.manager.update(Feed, userFeedIds, {
        status: { id: 3 },
      });
      await queryRunner.manager.softDelete(Feed, userFeedIds);
    }
  };

  private deleteUserUploadFiles = async (
    queryRunner: QueryRunner,
    userId: number
  ): Promise<void> => {
    const unusedFileLinks: DeleteUploadFiles | undefined =
      await this.uploadFileService.deleteUnusedUploadFiles(queryRunner, userId);

    if (unusedFileLinks) {
      await this.uploadFileService.deleteUnconnectedLinks(
        queryRunner,
        unusedFileLinks.uploadFileWithoutFeedId,
        unusedFileLinks.deleteFileLinksArray,
        userId
      );
    }
  };

  private deleteUserComments = async (
    queryRunner: QueryRunner,
    userCommentsInfo: CommentListByUserId
  ): Promise<void> => {
    const userCommentIds: number[] = userCommentsInfo.commentListByUserId.map(
      (comment: { id: number }) => comment.id
    );
    if (userCommentIds.length > 0) {
      await queryRunner.manager.softDelete(Comment, userCommentIds);
    }
  };

  private deleteUserSymbols = async (
    queryRunner: QueryRunner,
    userSymbols: FeedSymbol[]
  ): Promise<void> => {
    const userSymbolIds: number[] = userSymbols.map(
      (symbol: FeedSymbol) => symbol.id
    );
    if (userSymbolIds.length > 0) {
      await queryRunner.manager.softDelete(FeedSymbol, userSymbolIds);
    }
  };
}
