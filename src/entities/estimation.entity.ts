import { Column, Entity } from 'typeorm';
import { Base } from './index.entity';

export type estimationType = 'double like' | 'like' | 'nothing';

@Entity('estimation')
export class Estimation extends Base {
  @Column({ type: 'enum', enum: ['double like', 'like', 'nothing'] })
  estimation: estimationType;
}
