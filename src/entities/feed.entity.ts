import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './users.entity';
import { Estimation } from './estimation.entity';
import { Category } from './category.entity';
import { FeedStatus } from './feedStatus.entity';
import { Comment } from './comment.entity';
import { FeedSymbol } from './feedSymbol.entity';
import { FeedUploadFiles } from './feedUploadFiles.entity';
import { Base } from './index.entity';

@Entity('feeds')
export class Feed extends Base {
  @ManyToOne(type => User, users => users.feed, {
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ length: 250 })
  title?: string;

  @Column({ length: 10000 })
  content?: string;

  @ManyToOne(type => Estimation, estimation => estimation.feed, {
    nullable: false,
  })
  @JoinColumn({ name: 'estimationId' })
  estimation?: Estimation;

  @ManyToOne(type => Category, categories => categories.feed, {
    nullable: false,
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @ManyToOne(type => FeedStatus, feed_status => feed_status.feed, {
    nullable: false,
  })
  @JoinColumn({ name: 'statusId' })
  status?: FeedStatus;

  @Column({ nullable: true })
  posted_at?: Date;

  @OneToMany(type => Comment, comment => comment.feed)
  comment?: Comment[];

  @OneToMany(type => FeedSymbol, feedSymbol => feedSymbol.feed)
  feedSymbol?: FeedSymbol[];

  @OneToMany(type => FeedUploadFiles, feedUploadFiles => feedUploadFiles.feed)
  feedUploadFiles?: FeedUploadFiles[];
}
