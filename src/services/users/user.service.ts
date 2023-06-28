import { UserDto } from '../../entities/dto/user.dto';
import { UserRepository } from '../../repositories/user.repository';
import bcrypt from 'bcryptjs';
import { Pagination } from '../../repositories/feed.repository';
import dataSource from '../../repositories/data-source';
import { FeedSymbol } from '../../entities/feedSymbol.entity';
import { User } from '../../entities/users.entity';
import { Feed } from '../../entities/feed.entity';
import UploadFileService from '../uploadFile.service';
import uploadFileService from '../uploadFile.service';
import { Comment } from '../../entities/comment.entity';
import validatorService from './validator.service';
import userContentService from './userContent.service';

const updateUserInfo = async (userId: number, userInfo: UserDto) => {
  const originUserInfo = await UserRepository.findOne({
    where: { id: userId },
  });

  if (
    userInfo.nickname === originUserInfo.nickname &&
    userInfo.email === originUserInfo.email &&
    !userInfo.password
  ) {
    const error = new Error('NO_CHANGE');
    error.status = 400;
    throw error;
  }

  if (
    userInfo.nickname &&
    userInfo.nickname !== originUserInfo.nickname &&
    !userInfo.password
  ) {
    await validatorService.checkDuplicateNickname(userInfo.nickname);
  }

  if (userInfo.email && userInfo.email !== originUserInfo.email) {
    await validatorService.checkDuplicateEmail(userInfo.email);
  }

  if (userInfo.password) {
    const salt = await bcrypt.genSalt();
    userInfo.password = await bcrypt.hash(userInfo.password, salt);
  }

  await UserRepository.update(userId, userInfo);
  return await UserRepository.findOne({
    where: { id: userId },
  });
};

const deleteUser = async (userId: number): Promise<void> => {
  // 사용자 정보의 유효성 검사 함수를 불러온다.
  const userInfo = await userContentService.findUserInfoByUserId(userId);

  const page: Pagination = { startIndex: undefined, limit: undefined };

  // 사용자의 모든 게시글을 불러온다.
  const userFeedsInfo = await userContentService.findUserFeedsByUserId(
    userId,
    page,
    {
      includeTempFeeds: true,
    }
  );

  // 사용자의 모든 덧글을 불러온다.
  const userCommentsInfo = await userContentService.findUserCommentsByUserId(
    userId,
    userId,
    page
  );

  // 사용자의 모든 좋아요 정보를 불러온다.
  const userSymbols = await dataSource.manager.find<FeedSymbol>('FeedSymbol', {
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

    const unusedFileLinks = await UploadFileService.deleteUnusedUploadFiles(
      queryRunner,
      userId
    );
    if (unusedFileLinks) {
      await uploadFileService.deleteUnconnectedLinks(
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

export default {
  updateUserInfo,
  deleteUser,
};
