import { Column, Entity, OneToMany } from 'typeorm';
import { Comment } from './comment.entity';
import { Feed } from './feed.entity';
import { FeedSymbol } from './feedSymbol.entity';
import { Base } from './base.entity';

@Entity('users')
export class User extends Base {
  @Column({ unique: true })
  nickname: string;

  @Column({ select: false })
  password: string;

  @Column({ unique: true })
  email: string;

  @OneToMany(() => Comment, comment => comment.user)
  comment: Comment[];

  @OneToMany(() => Feed, feed => feed.user)
  feed: Feed[];

  @OneToMany(() => FeedSymbol, feedSymbol => feedSymbol.user)
  feedSymbol: FeedSymbol[];

  constructor(
    nickname: string,
    password: string,
    email: string,
    comment: Comment[],
    feed: Feed[],
    feedSymbol: FeedSymbol[]
  ) {
    super();
    this.nickname = nickname;
    this.password = password;
    this.email = email;
    this.comment = comment;
    this.feed = feed;
    this.feedSymbol = feedSymbol;
  }
}
