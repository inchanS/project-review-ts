import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Comment } from './comment.entity';
import { Feed } from './feed.entity';
import { FeedSymbol } from './feedSymbol.entity';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at?: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deleted_at?: Date;

  @Column({ unique: true })
  nickname: string;

  @Column({ select: false })
  password: string;

  @Column({ unique: true })
  email: string;

  static findByEmail(email: string) {
    return (
      this.createQueryBuilder('user')
        // user.password 컬럼의 경우 {select: false} 옵션으로 보호처리했기때문에 필요시 직접 넣어줘야한다.
        .addSelect('user.password')
        // typeORM은 삭제된 유저를 찾지 않는다. 하지만 softDelete로 삭제된 유저의 경우에도 findByEmail을 통해 찾아야 실제 가입시 Entity Duplicated 에러를 방지할 수 있다.
        .withDeleted()
        .where('email = :email', { email })
        .getOne()
    );
  }

  static findByNickname(nickname: string) {
    return this.createQueryBuilder('user')
      .withDeleted()
      .where('nickname = :nickname', {
        nickname,
      })
      .getOne();
  }

  @OneToMany(type => Comment, comment => comment.user)
  comment: Comment[];

  @OneToMany(type => Feed, feed => feed.user)
  feed: Feed[];

  @OneToMany(type => FeedSymbol, feedSymbol => feedSymbol.user)
  feedSymbol: [];
}
