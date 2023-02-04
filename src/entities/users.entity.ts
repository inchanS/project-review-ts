import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Comment } from './comment.entity';
import { Feed } from './feed.entity';
import { FeedSymbol } from './feedSymbol.entity';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @CreateDateColumn({
    type: 'datetime',
  })
  public created_at?: Date;

  @UpdateDateColumn({
    type: 'datetime',
  })
  public updated_at?: Date;

  @Column({ unique: true })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  nickname?: string;

  @Column({ select: false })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(20)
  // @Matches(/^[a-zA-Z0-9]*$/, {
  //   message: 'password only accepts english and number',
  // })
  // TODO 정규식 살펴보기
  @Matches(/^.*(?=^.{8,}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/, {
    message: 'password only accepts english and number 그리고 특수기호',
  })
  password?: string;

  @Column({ unique: true })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(50)
  email?: string;

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
  comment?: Comment[];

  @OneToMany(type => Feed, feed => feed.user)
  feed?: Feed[];

  @OneToMany(type => FeedSymbol, feedSymbol => feedSymbol.user)
  feedsymbol?: [];
}
