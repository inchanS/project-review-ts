import { Column, Entity, OneToMany } from 'typeorm';
import { Base } from './base.entity';
import { FeedSymbol } from './feedSymbol.entity';

export type symbolType = 'like' | 'I have this too';

@Entity('symbol')
export class Symbol extends Base {
  @Column({ type: 'enum', enum: ['like', 'I have this too'], unique: true })
  symbol: symbolType;

  @OneToMany(type => FeedSymbol, feedSymbol => feedSymbol.symbol)
  feedSymbol: FeedSymbol[];
}
