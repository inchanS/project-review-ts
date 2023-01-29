import dataSource from './index.dao';
import { User } from '../entities/users.entity';

const userRepository = dataSource.manager.getRepository(User);

export { userRepository };
