import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './users.entity';
import { Estimation } from './estimation.entity';
import { Category } from './category.entity';
import { FeedStatus } from './feedStatus.entity';
import { Comment } from './comment.entity';
import { FeedSymbol } from './feedSymbol.entity';
import { Base } from './index.entity';
import { UploadFiles } from './uploadFiles.entity';

@Entity('feeds')
export class Feed extends Base {
  @ManyToOne(type => User, users => users.feed)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 250, nullable: true })
  title: string;

  @Column({ length: 10000, nullable: true })
  content: string;

  @ManyToOne(type => Estimation, estimation => estimation.feed, {
    nullable: true,
  })
  @JoinColumn({ name: 'estimationId' })
  estimation: Estimation;

  @ManyToOne(type => Category, categories => categories.feed, {
    nullable: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(type => FeedStatus, feed_status => feed_status.feed)
  @JoinColumn({ name: 'statusId' })
  status?: FeedStatus;

  @Column({ type: 'timestamp', nullable: true })
  posted_at?: Date;

  @OneToMany(type => Comment, comment => comment.feed)
  comment?: Comment[];

  @OneToMany(type => FeedSymbol, feedSymbol => feedSymbol.feed)
  feedSymbol?: FeedSymbol[];

  @OneToMany(type => UploadFiles, uploadFiles => uploadFiles.feed)
  uploadFiles?: UploadFiles[];
}
