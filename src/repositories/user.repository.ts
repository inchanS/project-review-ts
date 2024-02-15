import dataSource from './data-source';
import { User } from '../entities/users.entity';
import { UserDto } from '../entities/dto/user.dto';
import { FindOneOptions, Repository, UpdateResult } from 'typeorm';

export class UserRepository extends Repository<User> {
  private static instance: UserRepository;

  private constructor() {
    super(User, dataSource.createEntityManager());
  }

  public static getInstance(): UserRepository {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  async createUser(userInfo: UserDto): Promise<void> {
    const user: User = this.create(userInfo);
    await this.save(user);
  }

  async findByEmail(email: string): Promise<User> {
    const result: Promise<User> = this.createQueryBuilder('user')
      // user.password 컬럼의 경우 {select: false} 옵션으로 보호처리했기때문에 필요시 직접 넣어줘야한다.
      .addSelect('user.password')
      // typeORM은 삭제된 유저를 찾지 않는다. 하지만 softDelete로 삭제된 유저의 경우에도 findByEmail을 통해 찾아야 실제 가입시 Entity Duplicated 에러를 방지할 수 있다.
      .withDeleted()
      .where('email = :email', { email })
      .getOneOrFail();

    return result;
  }

  async findByNickname(nickname: string): Promise<User> {
    return this.createQueryBuilder('user')
      .withDeleted()
      .where('nickname = :nickname', {
        nickname,
      })
      .getOneOrFail();
  }

  async findOneOrFail(options: FindOneOptions): Promise<User> {
    return super.findOneOrFail(options);
  }

  async findOne(options: FindOneOptions): Promise<User | null> {
    return super.findOne(options);
  }

  async update(userId: number, userInfo: UserDto): Promise<UpdateResult> {
    return super.update(userId, userInfo);
  }
}
