import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './users.entity';
import { Feed } from './feed.entity';
import { Base } from './index.entity';

@Entity('comments')
export class Comment extends Base {
  @ManyToOne(type => User, users => users.comment, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(type => Feed, feeds => feeds.comment, { nullable: false })
  @JoinColumn({ name: 'feedId' })
  feed: Feed;

  @Column({ length: 1000 })
  comment: string;

  @Column('boolean', { default: false })
  is_private: boolean;

  @Column('boolean', { default: false })
  is_deleted: boolean;

  @ManyToOne(type => Comment, comment => comment.children)
  @JoinColumn({ name: 'parentId' })
  parent: Comment;

  @OneToMany(type => Comment, comment => comment.parent)
  children: Comment[];
}
