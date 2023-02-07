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
    throw new Error(`${userInfo.email}_IS_MAIL_THAT_ALREADY_EXSITS`);
  }

  const uniqueCheckNickname = await User.findByNickname(userInfo.nickname);
  if (uniqueCheckNickname) {
    throw new Error(`${userInfo.nickname}_IS_NICKNAME_THAT_ALREADY_EXSITS`);
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
    throw new Error(`NICKNAME_IS_UNDEFINED`);
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
  console.log(
    '🔥users.service/signIn:66- checkUserbyEmail = ',
    checkUserbyEmail
  );
  if (!checkUserbyEmail) {
    throw new Error(`${email}_IS_NOT_FOUND`);
  }

  const isSame = bcrypt.compareSync(password, checkUserbyEmail.password);
  if (!isSame) {
    const error = new Error('PASSWORD_IS_INCORRECT');
    error.status = 404;
    throw error;
  }

  const jwtSecret = process.env.SECRET_KEY;
  const token = jwt.sign({ id: checkUserbyEmail.id }, jwtSecret);

  return { token };
};

const getMe = async (userId: number): Promise<object> => {
  if (!userId) {
    throw new Error(`TOKEN'S_USERID_IS_UNDEFINED`);
  }
  const myInfo = await UserRepository.findOne({ where: { id: userId } });
  const myFeeds = await FeedListRepository.getFeedListByUserId(userId);
  const myComments = await CommentRepository.getCommentListByUserId(userId);
  return { myInfo, myFeeds, myComments };
};

export default { signUp, signIn, getMe, checkDuplicateNickname };
