import { Column, Entity, OneToMany } from 'typeorm';
import { Base } from './base.entity';
import { Feed } from './feed.entity';

@Entity('categories')
export class Category extends Base {
  @Column({ length: 100 })
  category: string;

  @Column({ length: 250, nullable: true })
  description: string;

  @OneToMany(type => Feed, feed => feed.category)
  feed: Feed[];
}
