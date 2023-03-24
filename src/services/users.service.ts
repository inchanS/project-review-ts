import { User } from '../entities/users.entity';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserDto } from '../entities/dto/user.dto';
import { UserRepository } from '../repositories/user.repository';
import { CommentRepository } from '../repositories/comment.repository';
import {
  FeedListOptions,
  FeedListRepository,
} from '../repositories/feed.repository';
import dataSource from '../repositories/index.db';
import { FeedSymbol } from '../entities/feedSymbol.entity';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import { Comment } from '../entities/comment.entity';
import UploadFileService from './uploadFile.service';
import uploadFileService from './uploadFile.service';
import { Feed } from '../entities/feed.entity';

const checkDuplicateNickname = async (nickname: string): Promise<object> => {
  if (!nickname) {
    const error = new Error(`NICKNAME_IS_UNDEFINED`);
    error.status = 400;
    throw error;
  }
  // const checkData = await userRepository.findOneBy({ nickname: nickname });
  const checkData = await User.findByNickname(nickname);

  if (!checkData) {
    return { message: 'AVAILABLE_NICKNAME' };
  }

  if (checkData.nickname === nickname) {
    const err = new Error(
      `${checkData.nickname}_IS_NICKNAME_THAT_ALREADY_EXSITS`
    );
    err.status = 409;
    throw err;
  }
};

const checkDuplicateEmail = async (email: string): Promise<object> => {
  if (!email) {
    const error = new Error(`EMAIL_IS_UNDEFINED`);
    error.status = 400;
    throw error;
  }
  const checkData = await User.findByEmail(email);

  if (!checkData) {
    return { message: 'AVAILABLE_EMAIL' };
  }

  if (checkData.email === email) {
    const err = new Error(`${checkData.email}_IS_EMAIL_THAT_ALREADY_EXSITS`);
    err.status = 409;
    throw err;
  }
};

const signUp = async (userInfo: UserDto): Promise<void> => {
  userInfo = plainToInstance(UserDto, userInfo);

  await validateOrReject(userInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  await checkDuplicateEmail(userInfo.email);
  await checkDuplicateNickname(userInfo.nickname);

  await UserRepository.createUser(userInfo);

  // const salt = await bcrypt.genSalt();
  // userInfo.password = await bcrypt.hash(userInfo.password, salt);
  //
  // const user = await userRepository.create(userInfo);
  // await userRepository.save(user);
};
const signIn = async (email: string, password: string): Promise<object> => {
  // // <version 1>
  // // user.password 컬럼의 경우 {select: false} 옵션으로 보호처리했기때문에 필요시 직접 넣어줘야한다.
  // const checkUserbyEmail = await dataSource
  //   .createQueryBuilder(User, 'user')
  //   .addSelect('user.password')
  //   .where('user.email = :email', { email: email })
  //   .getOne();

  // <version 2> User entity에서 static 메소드 리턴시,
  // typeORM 문법으로 삭제된 유저, 즉 deleted_at이 not null인 유저는 제외하고 리턴한다.
  const checkUserbyEmail = await User.findByEmail(email);

  if (!checkUserbyEmail) {
    const error = new Error(`${email}_IS_NOT_FOUND`);
    error.status = 404;
    throw error;
  }

  const isSame = bcrypt.compareSync(password, checkUserbyEmail.password);
  if (!isSame) {
    const error = new Error('PASSWORD_IS_INCORRECT');
    error.status = 401;
    throw error;
  }

  const jwtSecret = process.env.SECRET_KEY;
  const token = jwt.sign({ id: checkUserbyEmail.id }, jwtSecret);

  return { token };
};

type UserInfo = {
  userInfo: User;
  userFeeds: FeedList[];
  userComments: Comment[];
};
const findUserInfoById = async (
  targetUserId: number,
  loggedInUserId: number,
  options?: FeedListOptions
): Promise<UserInfo> => {
  const userInfo = await UserRepository.findOne({
    where: { id: targetUserId },
  });

  if (!userInfo) {
    const error = new Error('USER_IS_NOT_FOUND');
    error.status = 404;
    throw error;
  }

  const userFeeds = await FeedListRepository.getFeedListByUserId(
    targetUserId,
    options
  );
  const userComments = await CommentRepository.getCommentListByUserId(
    targetUserId
  );

  for (const comment of userComments) {
    const isPrivate =
      comment.is_private === true && comment.user !== loggedInUserId;
    const isDeleted = comment.deleted_at !== null;
    comment.comment = isDeleted
      ? '## DELETED_COMMENT ##'
      : isPrivate
      ? '## PRIVATE_COMMENT ##'
      : comment.comment;

    comment.created_at = comment.created_at.substring(0, 19);
    comment.updated_at = comment.updated_at.substring(0, 19);
    comment.deleted_at = comment.deleted_at
      ? comment.deleted_at.substring(0, 19)
      : null;
  }

  return { userInfo, userFeeds, userComments };
};

// 로그인 유저가 자신의 정보를 불러올때 사용하는 함수
const getMe = async (userId: number): Promise<object> => {
  if (!userId) {
    const error = new Error(`TOKEN'S_USERID_IS_UNDEFINED`);
    error.status = 400;
    throw error;
  }
  return findUserInfoById(userId, userId);
};

// 로그인 유저가 다른 유저의 정보를 불러올때 사용하는 함수
const getUserInfo = async (
  targetUserId: number,
  loggedInUserId: number
): Promise<object> => {
  if (!targetUserId) {
    const error = new Error(`USERID_IS_UNDEFINED`);
    error.status = 400;
    throw error;
  }
  return findUserInfoById(targetUserId, loggedInUserId);
};

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
    await checkDuplicateNickname(userInfo.nickname);
  }

  if (userInfo.email && userInfo.email !== originUserInfo.email) {
    await checkDuplicateEmail(userInfo.email);
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
  const userInfo = await findUserInfoById(userId, userId, {
    includeTempFeeds: true,
  });
  const userSymbols = await dataSource.manager.find<FeedSymbol>('FeedSymbol', {
    loadRelationIds: true,
    where: { user: { id: userId } },
  });

  if (!userInfo) throw { status: 404, message: 'USER_IS_NOT_FOUND' };

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userFeedIds = userInfo.userFeeds.map(feed => feed.id);
    const userCommentIds = userInfo.userComments.map(comment => comment.id);
    const userSymbolIds = userSymbols.map(symbol => symbol.id);

    // 사용자의 User entity를 삭제한다.
    await queryRunner.manager.softDelete(User, userId);

    // 사용자의 Feed entity를 모두 삭제한다.
    if (userFeedIds.length > 0) {
      await queryRunner.manager.softDelete(Feed, userFeedIds);
    }
    // feed를 모두 삭제한 후, 사용하지 않는 fileLinks를 삭제한다.

    // UploadFilesService.deleteUnusedUploadFiles()함수를 사용하기 위해 Feed entity를 만들어서
    // id만 넣어준다.
    // const mockUserEntity = new User();
    // mockUserEntity.id = userId;
    // const userInfoForDeleteFileLinks = new Feed();
    // userInfoForDeleteFileLinks.user = mockUserEntity;

    const unusedFileLinks = await UploadFileService.deleteUnusedUploadFiles(
      queryRunner,
      userId
    );
    if (unusedFileLinks) {
      await uploadFileService.deleteUnconnectedLinks(
        queryRunner,
        unusedFileLinks.uploadFileWithoutFeedId,
        unusedFileLinks.deleteFileLinksArray
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

// TODO 나중에 프로필 이미지 넣어볼까나
export default {
  signUp,
  signIn,
  getMe,
  checkDuplicateNickname,
  checkDuplicateEmail,
  getUserInfo,
  updateUserInfo,
  deleteUser,
};
