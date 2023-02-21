import { Column, Entity, OneToMany } from 'typeorm';
import { Base } from './index.entity';
import { FeedUploadFiles } from './feedUploadFiles.entity';

@Entity('upload_files')
export class UploadFiles extends Base {
  @Column('boolean', { default: true })
  is_img?: boolean;

  @Column()
  file_link: string;

  @Column({ nullable: true })
  file_name?: string;

  @OneToMany(
    type => FeedUploadFiles,
    feedUploadFiles => feedUploadFiles.uploadFiles
  )
  feedUploadFiles?: FeedUploadFiles[];
}
