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
  const hashedPassword = await bcrypt.hash(userInfo.password, salt);
  userInfo.password = hashedPassword;

  return await usersDao.signUp(userInfo);
};

const signIn = async (email: string, password: string): Promise<object> => {
  const checkUserbyEmail = await userRepository.findOneBy({
    email: email,
  });
  if (!checkUserbyEmail) {
    throw new Error(`${email}_NOT_FOUND`);
  }

  const isSame = bcrypt.compareSync(password, checkUserbyEmail.password);
  if (!isSame) {
    console.log(isSame);
    const error = new Error('PASSWORD_IS_INCORRECT');
    error.status = 404;
    throw error;
  }

  const jwtSecret = process.env.SECRET_KEY;
  const token = jwt.sign({ id: checkUserbyEmail.id }, jwtSecret);

  return { token };
};

export default { signUp, signIn };
