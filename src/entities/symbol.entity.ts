import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { Base } from './base.entity';
import { FeedSymbol } from './feedSymbol.entity';

export enum symbolType {
  Like = 'like',
  haveThisToo = 'I have this too',
}

@Entity('symbol')
@Unique(['symbol'])
export class Symbol extends Base {
  @Column({ type: 'enum', enum: symbolType })
  symbol: symbolType;

  @OneToMany(() => FeedSymbol, feedSymbol => feedSymbol.symbol)
  feedSymbol?: FeedSymbol[];

  constructor(symbol: symbolType) {
    super();
    this.symbol = symbol;
  }
}
