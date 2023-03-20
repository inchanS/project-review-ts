import { User } from '../entities/users.entity';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserDto } from '../entities/dto/user.dto';
import { UserRepository } from '../repositories/user.repository';
import { CommentRepository } from '../repositories/comment.repository';
import { FeedListRepository } from '../repositories/feed.repository';

const signUp = async (userInfo: UserDto): Promise<void> => {
  userInfo = plainToInstance(UserDto, userInfo);

  await validateOrReject(userInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  const uniqueCheckEmail = await User.findByEmail(userInfo.email);
  if (uniqueCheckEmail) {
    const error = new Error(`${userInfo.email}_IS_MAIL_THAT_ALREADY_EXSITS`);
    error.status = 409;
    throw error;
  }

  const uniqueCheckNickname = await User.findByNickname(userInfo.nickname);
  if (uniqueCheckNickname) {
    const error = new Error(
      `${userInfo.nickname}_IS_NICKNAME_THAT_ALREADY_EXSITS`
    );
    error.status = 409;
    throw error;
  }

  await UserRepository.createUser(userInfo);

  // const salt = await bcrypt.genSalt();
  // userInfo.password = await bcrypt.hash(userInfo.password, salt);
  //
  // const user = await userRepository.create(userInfo);
  // await userRepository.save(user);
};

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
const signIn = async (email: string, password: string): Promise<object> => {
  // // <version 1>
  // // user.password 컬럼의 경우 {select: false} 옵션으로 보호처리했기때문에 필요시 직접 넣어줘야한다.
  // const checkUserbyEmail = await dataSource
  //   .createQueryBuilder(User, 'user')
  //   .addSelect('user.password')
  //   .where('user.email = :email', { email: email })
  //   .getOne();

  // <version 2> User entity에서 static 메소드 리턴시,
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

// TODO user 삭제 API
//  모든 서비스에서 user의 deleted_at이 not null일때 모두 탈퇴회원 처리

const findUserInfoById = async (
  targetUserId: number,
  loggedInUserId: number
): Promise<object> => {
  const userInfo = await UserRepository.findOne({
    where: { id: targetUserId },
  });

  if (!userInfo) {
    const error = new Error('USER_IS_NOT_FOUND');
    error.status = 404;
    throw error;
  }

  const userFeeds = await FeedListRepository.getFeedListByUserId(targetUserId);
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

export default {
  signUp,
  signIn,
  getMe,
  checkDuplicateNickname,
  checkDuplicateEmail,
  getUserInfo,
};
