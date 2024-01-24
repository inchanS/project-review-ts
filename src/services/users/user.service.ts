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
import { Pagination } from '../../repositories/feedList.repository';

export class UserService {
  private userRepository: UserRepository;
  private feedSymbolRepository: FeedSymbolRepository;
  private uploadFileService: UploadFileService;
  private userContentService: UserContentService;
  private validatorService: ValidatorService;

  constructor() {
    this.userRepository = new UserRepository();
    this.feedSymbolRepository = new FeedSymbolRepository();
    this.uploadFileService = new UploadFileService();
    this.userContentService = new UserContentService();
    this.validatorService = new ValidatorService();
  }

  public updateUserInfo = async (userId: number, userInfo: UserDto) => {
    const originUserInfo = await this.userRepository.findOne({
      where: { id: userId },
    });

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
    return await this.userRepository.findOne({
      where: { id: userId },
    });
  };

  public deleteUser = async (userId: number): Promise<void> => {
    // 사용자 정보의 유효성 검사 함수를 불러온다.
    const userInfo = await this.userContentService.findUserInfoByUserId(userId);

    const page: Pagination = { startIndex: undefined, limit: undefined };

    // 사용자의 모든 게시글을 불러온다.
    const userFeedsInfo = await this.userContentService.findUserFeedsByUserId(
      userId,
      page,
      {
        includeTempFeeds: true,
      }
    );

    // 사용자의 모든 덧글을 불러온다.
    const userCommentsInfo =
      await this.userContentService.findUserCommentsByUserId(
        userId,
        userId,
        page
      );

    // 사용자의 모든 좋아요 정보를 불러온다.
    const userSymbols = await this.feedSymbolRepository.find({
      loadRelationIds: true,
      where: { user: { id: userId } },
    });

    // transaction을 시작한다.
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userFeedIds = userFeedsInfo.feedListByUserId.map(
        (feed: { id: number }) => feed.id
      );
      const userCommentIds = userCommentsInfo.commentListByUserId.map(
        (comment: { id: number }) => comment.id
      );
      const userSymbolIds = userSymbols.map(symbol => symbol.id);

      // 사용자의 email을 변경한다. 추후 해당 email의 재사용을 위한 고민중 230607 수정
      const email = `${userInfo.email}.deleted.${Date.now()}`;
      // 객체 리터럴 단축구문으로 email의 변경내용을 간략하게 표현한다. 230607 수정
      await queryRunner.manager.update(User, userId, { email });

      // 사용자의 User entity를 삭제한다.
      await queryRunner.manager.softDelete(User, userId);

      // 사용자의 Feed entity를 모두 삭제한다.
      if (userFeedIds.length > 0) {
        await queryRunner.manager.softDelete(Feed, userFeedIds);
      }
      // feed를 모두 삭제한 후, 사용하지 않는 fileLinks를 삭제한다.

      const unusedFileLinks =
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
