import { User } from '../entities/users.entity';
import { DataSource } from 'typeorm';
import { UserDto } from '../entities/dto/user.dto';

export class UserCustomRepository {
  constructor(private dataSource: DataSource) {}

  private get userRepository() {
    return this.dataSource.getRepository(User);
  }

  async createUser(userInfo: UserDto): Promise<void> {
    const user: User = this.userRepository.create(userInfo);
    await this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return (
      this.userRepository
        .createQueryBuilder('user')
        // user.password 컬럼의 경우 {select: false} 옵션으로 보호처리했기때문에 필요시 직접 넣어줘야한다.
        .addSelect('user.password')
        // typeORM은 삭제된 유저를 찾지 않는다. 하지만 softDelete로 삭제된 유저의 경우에도 findByEmail을 통해 찾아야 실제 가입시 Entity Duplicated 에러를 방지할 수 있다.
        .withDeleted()
        .where('email = :email', { email })
        .getOne()
    );
  }
}
