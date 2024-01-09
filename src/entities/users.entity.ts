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

  @OneToMany(type => Comment, comment => comment.user)
  comment: Comment[];

  @OneToMany(type => Feed, feed => feed.user)
  feed: Feed[];

  @OneToMany(type => FeedSymbol, feedSymbol => feedSymbol.user)
  feedSymbol: [];
}
