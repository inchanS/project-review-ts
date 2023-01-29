import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from './users.entity';
import { Feed } from './feed.entity';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Base } from './index.entity';

@Entity('comments')
export class Comment extends Base {
  @ManyToOne(type => User, users => users.id, { nullable: false })
  @IsNotEmpty()
  @IsNumber()
  user: number;

  @ManyToOne(type => Feed, feeds => feeds.id, { nullable: false })
  @IsNotEmpty()
  @IsNumber()
  feed: number;

  @Column({ length: 1000 })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @Column('int')
  @IsNumber()
  reply_id: number;

  @Column('boolean', { default: false })
  is_private: boolean;

  @Column('boolean', { default: false })
  is_deleted: boolean;
}
