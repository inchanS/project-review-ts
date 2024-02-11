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

  @OneToMany(() => Comment, comment => comment.user)
  comment: Comment[];

  @OneToMany(() => Feed, feed => feed.user)
  feed: Feed[];

  @OneToMany(() => FeedSymbol, feedSymbol => feedSymbol.user)
  feedSymbol: FeedSymbol[];

  constructor(
    id: number,
    nickname: string,
    password: string,
    email: string,
    comment: Comment[],
    feed: Feed[],
    feedSymbol: FeedSymbol[]
  ) {
    super();
    this.id = id;
    this.nickname = nickname;
    this.password = password;
    this.email = email;
    this.comment = comment;
    this.feed = feed;
    this.feedSymbol = feedSymbol;
  }
}
