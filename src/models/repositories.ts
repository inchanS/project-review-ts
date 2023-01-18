import dataSource from './index';
import { User } from '../entities/users.entity';

const userRepository = dataSource.getRepository(User);

export { userRepository };
