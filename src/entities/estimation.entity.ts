import { Column, Entity } from 'typeorm';
import { Base } from './index.entity';

export type estimationType = 'double Like' | 'like';

@Entity('estimation')
export class Estimation extends Base {
  @Column({ type: 'enum', enum: ['double like', 'like'] })
  estimation: estimationType;
}
