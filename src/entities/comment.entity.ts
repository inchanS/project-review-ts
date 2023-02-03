import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { User } from './users.entity';
import { Feed } from './feed.entity';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Base } from './index.entity';

@Entity('comments')
export class Comment extends Base {
  @ManyToOne(type => User, users => users.comment, { nullable: false })
  user?: User;

  @RelationId((comment: Comment) => comment.user)
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ManyToOne(type => Feed, feeds => feeds.comment, { nullable: false })
  feed?: Feed;

  @RelationId((comment: Comment) => comment.feed)
  @IsNotEmpty()
  @IsNumber()
  feedId: number;

  @Column({ length: 1000 })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ManyToOne(type => Comment, comment => comment.children)
  parent?: Comment;

  @RelationId((comment: Comment) => comment.parent)
  @IsNumber()
  parentId?: number;

  @OneToMany(type => Comment, comment => comment.parent)
  children?: Comment[];

  @Column('boolean', { default: false })
  is_private?: boolean;

  @Column('boolean', { default: false })
  is_deleted?: boolean;
}
