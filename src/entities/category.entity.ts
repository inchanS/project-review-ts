import { Column, Entity, OneToMany } from 'typeorm';
import { Base } from './index.entity';
import { Feed } from './feed.entity';

@Entity('categories')
export class Category extends Base {
  @Column({ length: 100 })
  category: string;

  @OneToMany(type => Feed, feed => feed.category)
  feed: Feed[];
}
