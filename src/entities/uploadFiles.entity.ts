import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Base } from './base.entity';
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

  @ManyToOne(() => Feed, feed => feed.uploadFiles)
  @JoinColumn({ name: 'feedId' })
  feed: Feed;

  constructor(
    file_link: string,
    file_name: string,
    file_size: string,
    feed: Feed
  ) {
    super();
    this.file_link = file_link;
    this.file_name = file_name;
    this.file_size = file_size;
    this.feed = feed;
  }
}
