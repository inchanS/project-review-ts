import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserDto } from '../../entities/dto/user.dto';
import { UserCustomRepository } from '../../repositories/user.customRepository';
import { ValidatorService } from './validator.service';
import { User } from '../../entities/users.entity';
import { MailOptions, SendMail } from '../../utils/sendMail';
import Mail from 'nodemailer/lib/mailer';
import { CustomError, transformAndValidateDTO } from '../../utils/util';
import { Repository } from 'typeorm';

// 사용자 회원가입, 로그인, 패스워드 리셋 관련 서비스
export class AuthService {
  constructor(
    private validatorService: ValidatorService,
    private userCustomRepository: UserCustomRepository,
    private userRepository: Repository<User>
  ) {
    this.validatorService = validatorService;
    this.userCustomRepository = userCustomRepository;
    this.userRepository = userRepository;
  }

  public signUp = async (userInfo: UserDto): Promise<void> => {
    userInfo = await transformAndValidateDTO(UserDto, userInfo);
    await this.checkUserUniqueness(userInfo);
    userInfo.password = await this.hashPassword(userInfo.password);
    await this.userCustomRepository.createUser(userInfo);
  };

  public signIn = async (
    email: string,
    password: string
  ): Promise<{ token: string }> => {
    const user: User | null = await this.userCustomRepository.findByEmail(
      email
    );

    if (!user || user.deleted_at) {
      throw new CustomError(404, `${email}_IS_NOT_FOUND`);
    }

    const isPasswordMatch: boolean = await bcrypt.compare(
      password,
      user.password
    );
    if (!isPasswordMatch) {
      throw new CustomError(401, 'PASSWORD_IS_INCORRECT');
    }

    const jwtSecret: string = process.env.SECRET_KEY;
    const token: string = jwt.sign({ id: user.id }, jwtSecret);

    return { token };
  };

  // 비밀번호 찾기 기능 구현
  public resetPassword = async (
    email: string,
    resetPasswordUrl: string
  ): Promise<void> => {
    const user: User = await this.findUserByEmail(email);
    const token: string = this.generateResetPasswordToken(user.id);
    const url: string = `${resetPasswordUrl}?token=${token}`;
    const mailOption: Mail.Options = this.createMailOption(email, url);
    await this.sendResetPasswordMail(mailOption);
  };

  private async checkUserUniqueness(userInfo: UserDto): Promise<void> {
    await this.validatorService.checkDuplicateEmail(userInfo.email);
    await this.validatorService.checkDuplicateNickname(userInfo.nickname);
  }

  private async hashPassword(password: string): Promise<string> {
    const salt: string = await bcrypt.genSalt();
    return await bcrypt.hash(password, salt);
  }

  private async findUserByEmail(email: string): Promise<User> {
    return await this.userRepository
      .findOneOrFail({ where: { email } })
      .catch(() => {
        throw new CustomError(404, 'USER_IS_NOT_FOUND');
      });
  }

  private generateResetPasswordToken(userId: number): string {
    const jwtSecret: string = process.env.SECRET_KEY;
    return jwt.sign({ id: userId }, jwtSecret, {
      expiresIn: '10m',
    });
  }

  private createMailOption(email: string, url: string): Mail.Options {
    return {
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
  }

  private async sendResetPasswordMail(mailOption: Mail.Options): Promise<void> {
    const mailOptions: MailOptions = {
      service: process.env.MAILSERVICE as string,
      host: process.env.MAILHOST as string,
      port: parseInt(process.env.MAILPORT as string, 10),
      secure: process.env.MAILSECURE === 'true',
      auth: {
        user: process.env.NODEMAILER_USER as string,
        pass: process.env.NODEMAILER_PASS as string,
      },
    };

    const sendMail: SendMail = new SendMail(mailOptions);
    await sendMail.executeSendMail(mailOption);
  }
}

// TODO 나중에 프로필 이미지 넣어볼까나
