import { Entity, ManyToOne } from 'typeorm';
import { Feed } from './feed.entity';
import { UploadFiles } from './uploadFiles.entity';
import { Base } from './index.entity';

@Entity('feed_uploadFiles')
export class FeedUploadFiles extends Base {
  @ManyToOne(type => Feed, feeds => feeds.id, { nullable: false })
  feed: number;

  @ManyToOne(type => UploadFiles, upload_files => upload_files.id, {
    nullable: false,
  })
  upload_files: number;
}
