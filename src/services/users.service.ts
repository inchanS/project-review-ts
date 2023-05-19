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
  FeedRepository,
  Pagination,
} from '../repositories/feed.repository';
import dataSource from '../repositories/data-source';
import { FeedSymbol } from '../entities/feedSymbol.entity';
import { Comment } from '../entities/comment.entity';
import UploadFileService from './uploadFile.service';
import uploadFileService from './uploadFile.service';
import { Feed } from '../entities/feed.entity';
import { sendMail } from '../utils/sendMail';
import { FeedSymbolRepository } from '../repositories/feedSymbol.repository';

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
    throw { status: 404, message: `${email}_IS_NOT_FOUND` };
  }

  const isSame = bcrypt.compareSync(password, checkUserbyEmail.password);
  if (!isSame) {
    throw { status: 401, message: 'PASSWORD_IS_INCORRECT' };
  }

  const jwtSecret = process.env.SECRET_KEY;
  const token = jwt.sign({ id: checkUserbyEmail.id }, jwtSecret);

  return { token };
};

// 유저 정보 찾기시 유저 정보의 확인
const findUserInfoByUserId = async (targetUserId: number) => {
  if (!targetUserId) {
    throw { status: 400, message: 'USER_ID_IS_UNDEFINED' };
  }

  const userInfo = await UserRepository.findOne({
    where: { id: targetUserId },
  });

  if (!userInfo) {
    const error = new Error('USER_IS_NOT_FOUND');
    error.status = 404;
    throw error;
  }

  return userInfo;
};

// 유저 정보 확인시 유저의 게시글 조회
const findUserFeedsByUserId = async (
  targetUserId: number,
  page: Pagination,
  options?: FeedListOptions
) => {
  if (!targetUserId) {
    throw { status: 400, message: 'USER_ID_IS_UNDEFINED' };
  }

  if (isNaN(page.startIndex) || isNaN(page.limit)) {
    page = undefined;
  } else if (page.startIndex < 1) {
    throw { status: 400, message: 'PAGE_START_INDEX_IS_INVALID' };
  }

  // 유저의 게시글 수 조회
  const feedCountByUserId = await FeedRepository.getFeedCountByUserId(
    targetUserId
  );

  // 클라이언트에서 보내준 limit에 따른 총 페이지 수 계산
  const totalPage = Math.ceil(feedCountByUserId / page.limit);

  const feedListByUserId = await FeedListRepository.getFeedListByUserId(
    targetUserId,
    page,
    options
  );

  return { feedCountByUserId, totalPage, feedListByUserId };
};

// 유저 정보 확인시 유저의 댓글 조회
const findUserCommentsByUserId = async (
  targetUserId: number,
  loggedInUserId: number,
  page?: Pagination
) => {
  if (!targetUserId) {
    throw { status: 400, message: 'USER_ID_IS_UNDEFINED' };
  }

  if (isNaN(page.startIndex) || isNaN(page.limit)) {
    page = undefined;
  }

  const commentCountByUserId = await CommentRepository.getCommentCountByUserId(
    targetUserId
  );

  // 클라이언트에서 보내준 limit에 따른 총 무한스크롤 횟수 계산
  const totalScrollCnt = Math.ceil(commentCountByUserId / page.limit);

  const userComments = await CommentRepository.getCommentListByUserId(
    targetUserId,
    page
  );

  for (const comment of userComments) {
    const isPrivate: boolean =
      comment.is_private === true &&
      comment.user.id !== loggedInUserId &&
      (comment.parent
        ? comment.parent.user.id !== loggedInUserId
        : comment.feed.user.id !== loggedInUserId);
    const isDeleted: boolean = comment.deleted_at !== null;
    comment.comment = isDeleted
      ? '## DELETED_COMMENT ##'
      : isPrivate
      ? '## PRIVATE_COMMENT ##'
      : comment.comment;

    // Date타입 재가공
    comment.created_at = comment.created_at.substring(0, 19);
    comment.updated_at = comment.updated_at.substring(0, 19);
    comment.deleted_at = comment.deleted_at
      ? comment.deleted_at.substring(0, 19)
      : null;
  }

  return { commentCountByUserId, totalScrollCnt, userComments };
};

// 유저 정보 확인시, 유저의 피드 심볼 조회
const findUserFeedSymbolsByUserId = async (
  targetUserId: number,
  page: Pagination
) => {
  if (!targetUserId) {
    throw { status: 400, message: 'USER_ID_IS_UNDEFINED' };
  }

  const feedSymbolCountByUserId =
    await FeedSymbolRepository.getFeedSymbolCountByUserId(targetUserId);

  // 클라이언트에서 보내준 limit에 따른 총 페이지 수 계산
  const totalPage = Math.ceil(feedSymbolCountByUserId / page.limit);

  if (Number.isInteger(page.startIndex) && Number.isInteger(page.limit)) {
    if (page.startIndex < 1) {
      throw { status: 400, message: 'PAGE_START_INDEX_IS_INVALID' };
    }
  }

  const feedSymbolListByUserId =
    await FeedSymbolRepository.getFeedSymbolsByUserId(targetUserId, page);

  return { feedSymbolCountByUserId, totalPage, feedSymbolListByUserId };
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
  // 사용자 정보의 유효성 검사 함수를 불러온다.
  await findUserInfoByUserId(userId);

  const page: Pagination = { startIndex: undefined, limit: undefined };

  // 사용자의 모든 게시글을 불러온다.
  const userFeedsInfo = await findUserFeedsByUserId(userId, page, {
    includeTempFeeds: true,
  });

  // 사용자의 모든 덧글을 불러온다.
  const userCommentsInfo = await findUserCommentsByUserId(userId, userId, page);

  // 사용자의 모든 좋아요 정보를 불러온다.
  const userSymbols = await dataSource.manager.find<FeedSymbol>('FeedSymbol', {
    loadRelationIds: true,
    where: { user: { id: userId } },
  });

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userFeedIds = userFeedsInfo.feedListByUserId.map(
      (feed: { id: number }) => feed.id
    );
    const userCommentIds = userCommentsInfo.userComments.map(
      (comment: { id: number }) => comment.id
    );
    const userSymbolIds = userSymbols.map(symbol => symbol.id);

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

// 비밀번호 찾기 기능 구현
const resetPassword = async (email: string, resetPasswordUrl: string) => {
  const user = await UserRepository.findOneOrFail({ where: { email } }).catch(
    () => {
      throw { status: 404, message: 'USER_IS_NOT_FOUND' };
    }
  );

  const jwtSecret = process.env.SECRET_KEY;
  const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '10m' });

  const url = `${resetPasswordUrl}/${token}`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: '비밀번호를 재설정해주세요 - review site',
    html: `
      <p>안녕하세요, Review Site입니다.</p>
      <p>비밀번호를 재설정하려면 아래 링크를 클릭해주세요.</p>
      <p>링크는 10분 후에 만료됩니다.</p>
      <a href="${url}">
        <button style="
          padding: 10px 20px;
          background-color: #676FA3;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">
          비밀번호 재설정
        </button>
      </a>
      <p>만약 비밀번호 재설정을 요청하지 않으셨다면, 이 메일을 무시하시면 됩니다.</p>
      <p>감사합니다.</p>
    `,
  };

  await sendMail(mailOptions);
  // 위와 같이 작성시 가독성과 코드의 간결함은 좋지만 클라이언트의 응답시간이 비동기 동작의 block으로 인해 길어짐
  // 이에 아래와 같이 작성
  // sendMail(mailOptions).then(r => {
  //   return new Promise((resolve, reject) => {
  //     resolve(r);
  //     reject(r);
  //   });
  // });

  return;
};

// TODO 나중에 프로필 이미지 넣어볼까나
export default {
  signUp,
  signIn,
  checkDuplicateNickname,
  checkDuplicateEmail,
  updateUserInfo,
  deleteUser,
  resetPassword,
  findUserInfoByUserId,
  findUserFeedsByUserId,
  findUserCommentsByUserId,
  findUserFeedSymbolsByUserId,
};
