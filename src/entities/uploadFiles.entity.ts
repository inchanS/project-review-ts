import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Base } from './index.entity';
import { Feed } from './feed.entity';

@Entity('upload_files')
export class UploadFiles extends Base {
  @Column('boolean', { default: true })
  is_img?: boolean;

  @Column()
  file_link: string;

  @Column({ nullable: true })
  file_name: string;

  @Column({ nullable: true })
  file_size: string;

  @ManyToOne(type => Feed, feed => feed.uploadFiles)
  @JoinColumn({ name: 'feedId' })
  feed: Feed;
}
