import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './users.entity';
import { Estimation } from './estimation.entity';
import { Category } from './category.entity';
import { FeedStatus } from './feedStatus.entity';
import { Comment } from './comment.entity';
import { FeedSymbol } from './feedSymbol.entity';
import { Base } from './base.entity';
import { UploadFiles } from './uploadFiles.entity';

@Entity('feeds')
export class Feed extends Base {
  @ManyToOne(() => User, users => users.feed)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 250, nullable: true })
  title: string;

  @Column({ length: 10000, nullable: true })
  content: string;

  @Column({ default: 0 })
  viewCnt: number;

  @ManyToOne(() => Estimation, estimation => estimation.feed, {
    nullable: true,
  })
  @JoinColumn({ name: 'estimationId' })
  estimation: Estimation;

  @ManyToOne(() => Category, categories => categories.feed, {
    nullable: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(() => FeedStatus, feed_status => feed_status.feed)
  @JoinColumn({ name: 'statusId' })
  status: FeedStatus;

  @Column({ type: 'timestamp', nullable: true })
  posted_at?: Date;

  @OneToMany(() => Comment, comment => comment.feed)
  comment?: Comment[];

  @OneToMany(() => FeedSymbol, feedSymbol => feedSymbol.feed)
  feedSymbol?: FeedSymbol[];

  @OneToMany(() => UploadFiles, uploadFiles => uploadFiles.feed)
  uploadFiles?: UploadFiles[];

  constructor(
    user: User,
    title: string,
    content: string,
    viewCnt: number,
    estimation: Estimation,
    category: Category,
    status: FeedStatus
  ) {
    super();
    this.user = user;
    this.title = title;
    this.content = content;
    this.viewCnt = viewCnt;
    this.estimation = estimation;
    this.category = category;
    this.status = status;
  }
}
