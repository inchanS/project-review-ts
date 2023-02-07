import { Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './users.entity';
import { Feed } from './feed.entity';
import { Symbol } from './symbol.entity';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Base } from './index.entity';

@Entity('feed_symbol')
@Index(['feed', 'user'], { unique: true })
export class FeedSymbol extends Base {
  @ManyToOne(type => User, users => users.feedSymbol, { nullable: false })
  @JoinColumn({ name: 'userId' })
  @IsNotEmpty()
  @IsNumber()
  user: User;

  @ManyToOne(type => Feed, feeds => feeds.feedSymbol, { nullable: false })
  @JoinColumn({ name: 'feedId' })
  @IsNotEmpty()
  @IsNumber()
  feed: Feed;

  @ManyToOne(type => Symbol, symbol => symbol.feedSymbol, { nullable: false })
  @JoinColumn({ name: 'symbolId' })
  @IsNotEmpty()
  @IsNumber()
  symbol: Symbol;
}
