import { Column, Entity, OneToMany } from 'typeorm';
import { Base } from './base.entity';
import { Feed } from './feed.entity';

enum EstimationType {
  DoubleLike = 'double like',
  Like = 'like',
  Dislike = 'dislike',
}

@Entity('estimation')
export class Estimation extends Base {
  @Column({
    type: 'enum',
    enum: EstimationType,
    unique: true,
  })
  estimation: EstimationType;

  @OneToMany(() => Feed, feed => feed.estimation)
  feed?: Feed[];

  constructor(estimation: EstimationType) {
    super();
    this.estimation = estimation;
  }
}
