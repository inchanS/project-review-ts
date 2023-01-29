import { Column, Entity, ManyToOne } from 'typeorm';
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

@Entity('feeds')
export class Feed extends Base {
  @ManyToOne(type => User, users => users.id, { nullable: false })
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

  @ManyToOne(type => Estimation, estimation => estimation.id, {
    nullable: false,
  })
  @IsNotEmpty()
  @IsNumber()
  estimation: number;

  @ManyToOne(type => Category, categories => categories.id, {
    nullable: false,
  })
  @IsNotEmpty()
  @IsNumber()
  category: number;

  @ManyToOne(type => FeedStatus, feed_status => feed_status.id, {
    nullable: false,
  })
  @IsNumber()
  status_id: number;

  @Column({ nullable: true })
  posted_at?: Date;
}
