import { Column, Entity } from 'typeorm';
import { Base } from './index.entity';

export type feedStatusType = 'published' | 'temporary' | 'deleted';

@Entity('feed_status')
export class FeedStatus extends Base {
  @Column({
    type: 'enum',
    enum: ['published', 'temporary', 'deleted'],
    default: 'temporary',
  })
  status: feedStatusType;
}
