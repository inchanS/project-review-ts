import { User } from '../../entities/users.entity';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserDto } from '../../entities/dto/user.dto';
import { UserRepository } from '../../repositories/user.repository';
import { sendMail } from '../../utils/sendMail';
import validatorService from './validator.service';

const signUp = async (userInfo: UserDto): Promise<void> => {
  userInfo = plainToInstance(UserDto, userInfo);

  await validateOrReject(userInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  await validatorService.checkDuplicateEmail(userInfo.email);
  await validatorService.checkDuplicateNickname(userInfo.nickname);

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

  if (!checkUserbyEmail || checkUserbyEmail.deleted_at) {
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
// 비밀번호 찾기 기능 구현
const resetPassword = async (email: string, resetPasswordUrl: string) => {
  const user = await UserRepository.findOneOrFail({ where: { email } }).catch(
    () => {
      throw { status: 404, message: 'USER_IS_NOT_FOUND' };
    }
  );

  const jwtSecret = process.env.SECRET_KEY;
  const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '10m' });

  const url = `${resetPasswordUrl}?token=${token}`;

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
  resetPassword,
};
