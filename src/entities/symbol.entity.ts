import { Column, Entity, OneToMany } from 'typeorm';
import { Base } from './base.entity';
import { FeedSymbol } from './feedSymbol.entity';

enum symbolType {
  Like = 'like',
  haveThisToo = 'I have this too',
}

@Entity('symbol')
export class Symbol extends Base {
  @Column({ type: 'enum', enum: symbolType, unique: true })
  symbol: symbolType;

  @OneToMany(() => FeedSymbol, feedSymbol => feedSymbol.symbol)
  feedSymbol: FeedSymbol[];

  constructor(symbol: symbolType, feedSymbol: FeedSymbol[]) {
    super();
    this.symbol = symbol;
    this.feedSymbol = feedSymbol;
  }
}
