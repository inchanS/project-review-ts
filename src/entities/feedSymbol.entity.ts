import { Entity, Index, ManyToOne } from 'typeorm';
import { User } from './users.entity';
import { Feed } from './feed.entity';
import { Symbol } from './symbol.entity';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Base } from './index.entity';

@Entity('feed_symbol')
@Index(['feed', 'user'], { unique: true })
export class FeedSymbol extends Base {
  @ManyToOne(type => User, users => users.id, { nullable: false })
  @IsNotEmpty()
  @IsNumber()
  user: number;

  @ManyToOne(type => Feed, feeds => feeds.id, { nullable: false })
  @IsNotEmpty()
  @IsNumber()
  feed: number;

  @ManyToOne(type => Symbol, symbol => symbol.id, { nullable: false })
  @IsNotEmpty()
  @IsNumber()
  symbol: number;
}
