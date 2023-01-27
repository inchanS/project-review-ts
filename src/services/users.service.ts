import usersDao from '../models/users.dao';
import { User } from '../entities/users.entity';
import { userRepository } from '../models/repositories';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const signUp = async (userInfo: User): Promise<void> => {
  userInfo = plainToClass(User, userInfo);

  await validateOrReject(userInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  const uniqueCheckEmail = await userRepository.findOneBy({
    email: userInfo.email,
  });
  if (uniqueCheckEmail) {
    throw new Error(`${userInfo.email}_IS_MAIL_THAT_ALREADY_EXSITS`);
  }

  const uniqueCheckNickname = await userRepository.findOneBy({
    nickname: userInfo.nickname,
  });
  if (uniqueCheckNickname) {
    throw new Error(`${userInfo.nickname}_IS_NICKNAME_THAT_ALREADY_EXSITS`);
  }

  const salt = await bcrypt.genSalt();
  userInfo.password = await bcrypt.hash(userInfo.password, salt);

  await usersDao.signUp(userInfo);
};

const checkDuplicateNickname = async (nickname: string): Promise<object> => {
  if (!nickname) {
    throw new Error(`NICKNAME_IS_UNDEFINED`);
  }
  console.log('nickname = ', nickname);
  const checkData = await userRepository.findOneBy({ nickname: nickname });
  console.log('checkData = ', checkData);

  if (!checkData || checkData.nickname !== nickname) {
    return { message: 'available nickname' };
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
  const checkUserbyEmail = await userRepository.findOneBy({
    email: email,
  });
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

const getMe = async (id: number): Promise<User> => {
  let result = await userRepository.findOneBy({ id: id });
  delete result.password;
  return result;
};

export default { signUp, signIn, getMe, checkDuplicateNickname };
