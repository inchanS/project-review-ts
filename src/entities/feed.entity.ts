import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './users.entity';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Estimation } from './estimation.entity';
import { Category } from './category.entity';
import { FeedStatus } from './feedStatus.entity';
import { Base } from './index.entity';
import { Comment } from './comment.entity';
import { FeedSymbol } from './feedSymbol.entity';
import { FeedUploadFiles } from './feedUploadFiles.entity';

@Entity('feeds')
export class Feed extends Base {
  @ManyToOne(type => User, users => users.feed, {
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  @IsNotEmpty()
  @IsNumber()
  user?: User;

  @Column({ length: 250 })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(250)
  title?: string;

  @Column({ length: 10000 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(10000)
  content?: string;

  @ManyToOne(type => Estimation, estimation => estimation.feed, {
    nullable: false,
  })
  @JoinColumn({ name: 'estimationId' })
  @IsNotEmpty()
  @IsNumber()
  estimation?: Estimation;

  @ManyToOne(type => Category, categories => categories.feed, {
    nullable: false,
  })
  @JoinColumn({ name: 'categoryId' })
  @IsNotEmpty()
  @IsNumber()
  category?: Category;

  @ManyToOne(type => FeedStatus, feed_status => feed_status.feed, {
    nullable: false,
  })
  @JoinColumn({ name: 'statusId' })
  @IsNotEmpty()
  @IsNumber()
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
