import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Base } from './base.entity';
import { Feed } from './feed.entity';
import { User } from './users.entity';

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

  @ManyToOne(() => Feed, feed => feed.uploadFiles, { nullable: true })
  @JoinColumn({ name: 'feedId' })
  feed: number;

  @ManyToOne(() => User, user => user.uploadFiles, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: number;

  constructor(
    file_link: string,
    file_name: string,
    file_size: string,
    feed: number,
    user: number
  ) {
    super();
    this.file_link = file_link;
    this.file_name = file_name;
    this.file_size = file_size;
    this.feed = feed;
    this.user = user;
  }
}
