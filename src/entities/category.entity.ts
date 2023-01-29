import { Column, Entity } from 'typeorm';
import { Base } from './index.entity';

@Entity('categories')
export class Category extends Base {
  @Column({ length: 100 })
  category: string;
}
