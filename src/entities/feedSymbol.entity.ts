import { Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './users.entity';
import { Feed } from './feed.entity';
import { Symbol } from './symbol.entity';
import { Base } from './base.entity';

@Entity('feed_symbol')
@Index(['feed', 'user'], { unique: true })
export class FeedSymbol extends Base {
  @ManyToOne(type => User, users => users.feedSymbol, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(type => Feed, feeds => feeds.feedSymbol, { nullable: false })
  @JoinColumn({ name: 'feedId' })
  feed: Feed;

  @ManyToOne(type => Symbol, symbol => symbol.feedSymbol, { nullable: false })
  @JoinColumn({ name: 'symbolId' })
  symbol: Symbol;
}
