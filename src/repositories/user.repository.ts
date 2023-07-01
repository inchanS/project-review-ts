import bcrypt from 'bcryptjs';
import dataSource from './data-source';
import { User } from '../entities/users.entity';
import { UserDto } from '../entities/dto/user.dto';
import { Repository } from 'typeorm';

export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = dataSource.getRepository(User);
  }
  async createUser(userInfo: UserDto) {
    const salt = await bcrypt.genSalt();
    userInfo.password = await bcrypt.hash(userInfo.password, salt);

    const user = await this.repository.create(userInfo);
    await this.repository.save(user);
  }
}
