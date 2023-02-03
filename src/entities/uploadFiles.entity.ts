import { Column, Entity, OneToMany } from 'typeorm';
import { Base } from './index.entity';
import { FeedUploadFiles } from './feedUploadFiles.entity';

@Entity('upload_files')
export class UploadFiles extends Base {
  @Column('boolean', { default: true })
  is_img: boolean;

  @Column({ length: 500 })
  file_link: string;

  @OneToMany(
    type => FeedUploadFiles,
    feedUploadFiles => feedUploadFiles.uploadFiles
  )
  feedUploadFiles: FeedUploadFiles[];
}
