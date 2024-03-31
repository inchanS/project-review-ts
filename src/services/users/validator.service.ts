import { UserRepository } from '../../repositories/user.repository';
import { CustomError } from '../../utils/util';
import { User } from '../../entities/users.entity';
import { EntityNotFoundError } from 'typeorm';

export class ValidatorService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  public validateUserInfo = async (targetUserId: number): Promise<User> => {
    this.validateUserId(targetUserId);
    return await this.userRepository
      .findOneOrFail({
        where: { id: targetUserId },
      })
      .catch((err: Error) => {
        if (err instanceof EntityNotFoundError) {
          throw new CustomError(404, `NOT_FOUND_USER`);
        }
        throw err;
      });
  };

  public checkDuplicateNickname = async (
    nickname: string
  ): Promise<{ message: string }> => {
    this.validateUserNickname(nickname);
    const user: User | null = await this.userRepository.findOne({
      where: { nickname: nickname },
    });

    if (user) {
      throw new CustomError(409, `${user.nickname}_ALREADY_EXISTS`);
    }
    return { message: 'AVAILABLE_NICKNAME' };
  };

  public checkDuplicateEmail = async (
    email: string
  ): Promise<{ message: string }> => {
    this.validateUserEmail(email);
    const existingUser: User | null = await this.userRepository.findByEmail(
      email
    );

    if (existingUser === null) {
      return { message: 'AVAILABLE_EMAIL' };
    } else {
      throw new CustomError(409, `${existingUser.email}_ALREADY_EXISTS`);
    }
  };

  private validateUserId(userId: number): void {
    if (!userId) {
      throw new CustomError(400, 'USER_ID_IS_REQUIRED');
    }
  }

  private validateUserNickname(nickname: string): void {
    if (!nickname) {
      throw new CustomError(400, `NICKNAME_IS_REQUIRED`);
    }
  }

  private validateUserEmail(email: string): void {
    if (!email) {
      throw new CustomError(400, 'EMAIL_IS_REQUIRED');
    }
  }
}
