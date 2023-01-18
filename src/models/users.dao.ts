import { User } from '../entities/users.entity';
import { userRepository } from './repositories';

const signUp = async (userInfo: User): Promise<void> => {
  const user = await userRepository.create(userInfo);
  await userRepository.save(user);
};

export default { signUp };
