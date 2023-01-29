import { Column, Entity } from 'typeorm';
import { Base } from './index.entity';

@Entity('upload_files')
export class UploadFiles extends Base {
  @Column('boolean', { default: true })
  is_img: boolean;

  @Column({ length: 500 })
  file_link: string;
}
