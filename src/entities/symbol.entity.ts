import { Column, Entity } from 'typeorm';
import { Base } from './index.entity';

export type symbolType = 'like' | 'I have this too';

@Entity('symbol')
export class Symbol extends Base {
  @Column({ type: 'enum', enum: ['like', 'I have this too'] })
  symbol: symbolType;
}
