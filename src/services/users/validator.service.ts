import { UserRepository } from '../../repositories/user.repository';
import { CustomError } from '../../utils/util';
import { User } from '../../entities/users.entity';

export class ValidatorService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = UserRepository.getInstance();
  }
  checkDuplicateNickname = async (
    nickname: string
  ): Promise<{ message: string }> => {
    if (!nickname) {
      throw new CustomError(400, `NICKNAME_IS_UNDEFINED`);
    }
    const checkData: User | null = await this.userRepository.findByNickname(
      nickname
    );

    if (!checkData) {
      return { message: 'AVAILABLE_NICKNAME' };
    } else {
      throw new CustomError(
        409,
        `${checkData.nickname}_IS_NICKNAME_THAT_ALREADY_EXSITS`
      );
    }
  };

  checkDuplicateEmail = async (email: string): Promise<{ message: string }> => {
    if (!email) {
      throw new CustomError(400, 'EMAIL_IS_UNDEFINED');
    }
    const checkData: User | null = await this.userRepository.findByEmail(email);

    if (checkData === null) {
      return { message: 'AVAILABLE_EMAIL' };
    } else {
      throw new CustomError(
        409,
        `${checkData.email}_IS_EMAIL_THAT_ALREADY_EXSITS`
      );
    }
  };
}
