import { Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { Feed } from './feed.entity';
import { UploadFiles } from './uploadFiles.entity';
import { Base } from './index.entity';
import { IsNotEmpty, IsNumber } from 'class-validator';

@Entity('feed_uploadFiles')
export class FeedUploadFiles extends Base {
  @ManyToOne(type => Feed, feeds => feeds.feedUploadFiles, { nullable: false })
  @JoinColumn({ name: 'feedId' })
  @IsNotEmpty()
  @IsNumber()
  feed: Feed;

  @ManyToOne(
    type => UploadFiles,
    upload_files => upload_files.feedUploadFiles,
    {
      nullable: false,
    }
  )
  @JoinColumn({ name: 'uploadFilesId' })
  @IsNotEmpty()
  @IsNumber()
  uploadFiles: UploadFiles;
}
