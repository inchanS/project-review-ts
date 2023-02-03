import { Column, Entity, OneToMany } from 'typeorm';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Base } from './index.entity';
import { Comment } from './comment.entity';
import { Feed } from './feed.entity';
import { FeedSymbol } from './feedSymbol.entity';

@Entity('users')
export class User extends Base {
  @Column({ unique: true })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  nickname?: string;

  @Column()
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
  @MaxLength(20)
  email?: string;

  @OneToMany(type => Comment, comment => comment.user)
  comment: Comment[];

  @OneToMany(type => Feed, feed => feed.user)
  feed: Feed[];

  @OneToMany(type => FeedSymbol, feedSymbol => feedSymbol.user)
  feedsymbol: [];
}
