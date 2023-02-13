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

  @CreateDateColumn({
    type: 'datetime',
    transformer: {
      from: (value: Date) =>
        value
          ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
              value.getDate()
            )} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(
              value.getSeconds()
            )}`
          : '',
      to: (value: string) => new Date(value),
    },
  })
  public created_at?: Date;

  @UpdateDateColumn({
    type: 'datetime',
    transformer: {
      from: (value: Date) =>
        value
          ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
              value.getDate()
            )} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(
              value.getSeconds()
            )}`
          : '',
      to: (value: string) => new Date(value),
    },
  })
  public updated_at?: Date;

  @DeleteDateColumn({
    type: 'datetime',
    transformer: {
      from: (value: Date) =>
        value
          ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
              value.getDate()
            )} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(
              value.getSeconds()
            )}`
          : '',
      to: (value: string) => new Date(value),
    },
  })
  deleted_at?: Date | null;

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
        .where('email = :email', { email })
        .getOne()
    );
  }

  static findByNickname(nickname: string) {
    return this.createQueryBuilder('user')
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

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}
