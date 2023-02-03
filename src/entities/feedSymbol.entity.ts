import { Entity, Index, ManyToOne, RelationId } from 'typeorm';
import { User } from './users.entity';
import { Feed } from './feed.entity';
import { Symbol } from './symbol.entity';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Base } from './index.entity';

@Entity('feed_symbol')
@Index(['feed', 'user'], { unique: true })
export class FeedSymbol extends Base {
  @ManyToOne(type => User, users => users.feedsymbol, { nullable: false })
  user: User;

  @RelationId((feedSymbol: FeedSymbol) => feedSymbol.user)
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ManyToOne(type => Feed, feeds => feeds.feedSymbol, { nullable: false })
  feed: Feed;

  @RelationId((feedSymbol: FeedSymbol) => feedSymbol.feed)
  @IsNotEmpty()
  @IsNumber()
  feedId: number;

  @ManyToOne(type => Symbol, symbol => symbol.feedSymbol, { nullable: false })
  symbol: Symbol;

  @RelationId((feedSymbol: FeedSymbol) => feedSymbol.symbol)
  @IsNotEmpty()
  @IsNumber()
  symbolId: number;
}
