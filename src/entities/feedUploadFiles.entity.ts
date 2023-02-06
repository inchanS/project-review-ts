import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Feed } from './feed.entity';
import { UploadFiles } from './uploadFiles.entity';
import { Base } from './index.entity';

@Entity('feed_uploadFiles')
export class FeedUploadFiles extends Base {
  @ManyToOne(type => Feed, feeds => feeds.feedUploadFiles, { nullable: false })
  @JoinColumn({ name: 'feedId' })
  feed: Feed;

  @ManyToOne(
    type => UploadFiles,
    upload_files => upload_files.feedUploadFiles,
    {
      nullable: false,
    }
  )
  @JoinColumn({ name: 'uploadFilesId' })
  uploadFiles: UploadFiles;
}
