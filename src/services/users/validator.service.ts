import { UserRepository } from '../../repositories/user.repository';
import { CustomError } from '../../utils/util';

export class ValidatorService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }
  checkDuplicateNickname = async (nickname: string): Promise<object> => {
    if (!nickname) {
      throw new CustomError(400, `NICKNAME_IS_UNDEFINED`);
    }
    // const checkData = await userRepository.findOneBy({ nickname: nickname });
    const checkData = await this.userRepository.findByNickname(nickname);

    if (!checkData) {
      return { message: 'AVAILABLE_NICKNAME' };
    }

    if (checkData.nickname === nickname) {
      throw new CustomError(
        409,
        `${checkData.nickname}_IS_NICKNAME_THAT_ALREADY_EXSITS`
      );
    }
  };

  checkDuplicateEmail = async (email: string): Promise<object> => {
    if (!email) {
      throw new CustomError(400, 'EMAIL_IS_UNDEFINED');
    }
    const checkData = await this.userRepository.findByEmail(email);

    if (!checkData) {
      return { message: 'AVAILABLE_EMAIL' };
    }

    if (checkData.email === email) {
      throw new CustomError(
        409,
        `${checkData.email}_IS_EMAIL_THAT_ALREADY_EXSITS`
      );
    }
  };
}
