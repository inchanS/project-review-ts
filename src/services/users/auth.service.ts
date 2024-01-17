import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserDto } from '../../entities/dto/user.dto';
import { UserRepository } from '../../repositories/user.repository';
import { ValidatorService } from './validator.service';
import { User } from '../../entities/users.entity';
import { MailOptions, SendMail } from '../../utils/sendMail';
import Mail from 'nodemailer/lib/mailer';
import { CustomError } from '../../utils/util';

export class AuthService {
  private userRepository: UserRepository;
  private validatorService: ValidatorService;

  constructor() {
    this.validatorService = new ValidatorService();
    this.userRepository = new UserRepository();
  }

  signUp = async (userInfo: UserDto): Promise<void> => {
    userInfo = plainToInstance(UserDto, userInfo);

    await validateOrReject(userInfo).catch(errors => {
      throw { status: 500, message: errors[0].constraints };
    });

    await this.validatorService.checkDuplicateEmail(userInfo.email);
    await this.validatorService.checkDuplicateNickname(userInfo.nickname);

    await this.userRepository.createUser(userInfo);
  };

  signIn = async (email: string, password: string): Promise<object> => {
    // // <version 1>
    // // user.password 컬럼의 경우 {select: false} 옵션으로 보호처리했기때문에 필요시 직접 넣어줘야한다.
    // const checkUserbyEmail = await dataSource
    //   .createQueryBuilder(User, 'user')
    //   .addSelect('user.password')
    //   .where('user.email = :email', { email: email })
    //   .getOne();

    // <version 2> User entity에서 static 메소드 리턴시,
    // typeORM 문법으로 삭제된 유저, 즉 deleted_at이 not null인 유저는 제외하고 리턴한다.
    // 하지만 softDelete로 삭제된 유저의 경우에도 findByEmail을 통해 찾아야 실제 가입시 Entity Duplicated 에러를 방지할 수 있다.

    const checkUserbyEmail: User = await this.userRepository.findByEmail(email);

    if (!checkUserbyEmail || checkUserbyEmail.deleted_at) {
      throw new CustomError(404, `${email}_IS_NOT_FOUND`);
    }

    const isSame: boolean = bcrypt.compareSync(
      password,
      checkUserbyEmail.password
    );
    if (!isSame) {
      throw new CustomError(401, 'PASSWORD_IS_INCORRECT');
    }

    const jwtSecret: string = process.env.SECRET_KEY;
    const token: string = jwt.sign({ id: checkUserbyEmail.id }, jwtSecret);

    return { token };
  };

  // 비밀번호 찾기 기능 구현
  resetPassword = async (
    email: string,
    resetPasswordUrl: string
  ): Promise<void> => {
    const user: User = await this.userRepository
      .findOneOrFail({ where: { email } })
      .catch(() => {
        throw new CustomError(404, 'USER_IS_NOT_FOUND');
      });

    const jwtSecret: string = process.env.SECRET_KEY;
    const token: string = jwt.sign({ id: user.id }, jwtSecret, {
      expiresIn: '10m',
    });

    const url: string = `${resetPasswordUrl}?token=${token}`;

    const mailOptions: MailOptions = {
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
    };

    const sendMail = new SendMail(mailOptions);
    const mailOption: Mail.Options = {
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

    await sendMail.executeSendMail(mailOption);

    // await sendMail(mailOptions);
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
}

// TODO 나중에 프로필 이미지 넣어볼까나
