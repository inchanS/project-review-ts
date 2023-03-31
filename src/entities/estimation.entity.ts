import { Column, Entity, OneToMany } from 'typeorm';
import { Base } from './index.entity';
import { Feed } from './feed.entity';

export type estimationType = 'double like' | 'like' | 'dislike';

@Entity('estimation')
export class Estimation extends Base {
  @Column({ type: 'enum', enum: ['double like', 'like', 'dislike'] })
  estimation: estimationType;

  @OneToMany(type => Feed, feed => feed.estimation)
  feed: Feed[];
}
