import bcrypt from 'bcryptjs';
import dataSource from './data-source';
import { User } from '../entities/users.entity';
import { UserDto } from '../entities/dto/user.dto';

export const UserRepository = dataSource.getRepository(User).extend({
  async createUser(userInfo: UserDto) {
    const salt = await bcrypt.genSalt();
    userInfo.password = await bcrypt.hash(userInfo.password, salt);

    const user = await this.create(userInfo);
    await this.save(user);
  },
});
