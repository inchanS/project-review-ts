import { Column, Entity, OneToMany } from 'typeorm';
import { Base } from './base.entity';
import { Feed } from './feed.entity';

export type feedStatusType = 'published' | 'temporary' | 'deleted';

// TODO 현재 이 엔티티가 아닌 deleted_at으로 삭제여부 판단하고 있음 - mysql에서 이렇게 찾으면 성능이 안좋을텐데
//   posted_at이나 deleted_at 컬럼에 인덱스를 걸어주는게 좋을까?
@Entity('feed_status')
export class FeedStatus extends Base {
  @Column({
    type: 'enum',
    enum: ['published', 'temporary', 'deleted'],
    default: 'temporary',
    unique: true,
  })
  is_status?: feedStatusType;

  @OneToMany(() => Feed, feed => feed.status)
  feed?: Feed[];
}
