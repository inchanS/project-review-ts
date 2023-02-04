import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './users.entity';
import { Feed } from './feed.entity';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Base } from './index.entity';

@Entity('comments')
export class Comment extends Base {
  @ManyToOne(type => User, users => users.comment, { nullable: false })
  @JoinColumn({ name: 'userId' })
  @IsNotEmpty()
  @IsNumber()
  user?: User;

  @ManyToOne(type => Feed, feeds => feeds.comment, { nullable: false })
  @JoinColumn({ name: 'feedId' })
  @IsNotEmpty()
  @IsNumber()
  feed?: Feed;

  @Column({ length: 1000 })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @Column('boolean', { default: false })
  is_private?: boolean;

  @Column('boolean', { default: false })
  is_deleted?: boolean;

  @ManyToOne(type => Comment, comment => comment.children)
  @JoinColumn({ name: 'parentId' })
  @IsNumber()
  parent?: Comment;

  @OneToMany(type => Comment, comment => comment.parent)
  children?: Comment[];
}
