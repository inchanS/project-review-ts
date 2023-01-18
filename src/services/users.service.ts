import usersDao from '../models/users.dao';
import { User } from '../entities/users.entity';
import { userRepository } from '../models/repositories';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import bcrypt from 'bcryptjs';

const signup = async (userInfo: User): Promise<void> => {
  userInfo = plainToClass(User, userInfo);

  await validateOrReject(userInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  const uniqueCheckEmail = await userRepository.findOneBy({
    email: userInfo.email,
  });
  if (uniqueCheckEmail) {
    throw new Error(`${userInfo.email} IS_MAIL_THAT_ALREADY_EXSITS`);
  }

  const uniqueCheckNickname = await userRepository.findOneBy({
    nickname: userInfo.nickname,
  });
  if (uniqueCheckNickname) {
    throw new Error(`${userInfo.nickname} IS_NICKNAME_THAT_ALREADY_EXSITS`);
  }

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(userInfo.password, salt);
  userInfo.password = hashedPassword;

  return await usersDao.signUp(userInfo);
};

export default { signup };
