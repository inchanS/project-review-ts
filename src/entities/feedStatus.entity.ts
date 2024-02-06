import { Column, Entity, OneToMany } from 'typeorm';
import { Base } from './index.entity';
import { Feed } from './feed.entity';

export type feedStatusType = 'published' | 'temporary' | 'deleted';

// FIXME 왜 이 엔티티 안쓰고 있지? 이거 안쓰고 deleted_at으로 삭제여부 판단하고 있음 - mysql에서 이렇게 찾으면 성능이 안좋을텐데
//   posted_at이나 deleted_at 컬럼에 인덱스를 걸어주는게 좋을까?
@Entity('feed_status')
export class FeedStatus extends Base {
  @Column({
    type: 'enum',
    enum: ['published', 'temporary', 'deleted'],
    default: 'temporary',
  })
  is_status?: feedStatusType;

  @OneToMany(type => Feed, feed => feed.status)
  feed?: Feed[];
}
