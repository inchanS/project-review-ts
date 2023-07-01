import { UserRepository } from '../../repositories/user.repository';

export class ValidatorService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }
  checkDuplicateNickname = async (nickname: string): Promise<object> => {
    if (!nickname) {
      const error = new Error(`NICKNAME_IS_UNDEFINED`);
      error.status = 400;
      throw error;
    }
    // const checkData = await userRepository.findOneBy({ nickname: nickname });
    const checkData = await this.userRepository.findByNickname(nickname);

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

  checkDuplicateEmail = async (email: string): Promise<object> => {
    if (!email) {
      const error = new Error(`EMAIL_IS_UNDEFINED`);
      error.status = 400;
      throw error;
    }
    const checkData = await this.userRepository.findByEmail(email);

    if (!checkData) {
      return { message: 'AVAILABLE_EMAIL' };
    }

    if (checkData.email === email) {
      const err = new Error(`${checkData.email}_IS_EMAIL_THAT_ALREADY_EXSITS`);
      err.status = 409;
      throw err;
    }
  };
}
