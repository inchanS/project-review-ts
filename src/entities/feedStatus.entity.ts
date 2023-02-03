import { Column, Entity, OneToMany } from 'typeorm';
import { Base } from './index.entity';
import { Feed } from './feed.entity';

export type feedStatusType = 'published' | 'temporary' | 'deleted';

@Entity('feed_status')
export class FeedStatus extends Base {
  @Column({
    type: 'enum',
    enum: ['published', 'temporary', 'deleted'],
    default: 'temporary',
  })
  is_status: feedStatusType;

  @OneToMany(type => Feed, feed => feed.status)
  feed: Feed[];
}
