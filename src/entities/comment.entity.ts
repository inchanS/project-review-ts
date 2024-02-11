import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './users.entity';
import { Feed } from './feed.entity';
import { Base } from './base.entity';

@Entity('comments')
export class Comment extends Base {
  @ManyToOne(() => User, users => users.comment, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Feed, feeds => feeds.comment, { nullable: false })
  @JoinColumn({ name: 'feedId' })
  feed: Feed;

  @Column({ length: 1000 })
  comment: string;

  @Column('boolean', { default: false })
  is_private: boolean;

  @ManyToOne(() => Comment, comment => comment.children)
  @JoinColumn({ name: 'parentId' })
  parent: Comment;

  @OneToMany(() => Comment, comment => comment.parent)
  children: Comment[];

  constructor(
    user: User,
    feed: Feed,
    comment: string,
    is_private: boolean,
    parent: Comment,
    children: Comment[]
  ) {
    super();
    this.user = user;
    this.feed = feed;
    this.comment = comment;
    this.is_private = is_private;
    this.parent = parent;
    this.children = children;
  }
}
