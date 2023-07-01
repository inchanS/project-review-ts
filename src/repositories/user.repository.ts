import bcrypt from 'bcryptjs';
import dataSource from './data-source';
import { User } from '../entities/users.entity';
import { UserDto } from '../entities/dto/user.dto';
import { FindOneOptions, Repository } from 'typeorm';

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

  async findByEmail(email: string) {
    return (
      this.repository
        .createQueryBuilder('user')
        // user.password 컬럼의 경우 {select: false} 옵션으로 보호처리했기때문에 필요시 직접 넣어줘야한다.
        .addSelect('user.password')
        // typeORM은 삭제된 유저를 찾지 않는다. 하지만 softDelete로 삭제된 유저의 경우에도 findByEmail을 통해 찾아야 실제 가입시 Entity Duplicated 에러를 방지할 수 있다.
        .withDeleted()
        .where('email = :email', { email })
        .getOne()
    );
  }

  async findByNickname(nickname: string) {
    return this.repository
      .createQueryBuilder('user')
      .withDeleted()
      .where('nickname = :nickname', {
        nickname,
      })
      .getOne();
  }

  async findOneOrFail(options: FindOneOptions): Promise<User> {
    return this.repository.findOneOrFail(options);
  }

  async findOne(options: FindOneOptions): Promise<User> {
    return this.repository.findOne(options);
  }
}
