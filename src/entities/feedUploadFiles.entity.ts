import { Entity, ManyToOne, RelationId } from 'typeorm';
import { Feed } from './feed.entity';
import { UploadFiles } from './uploadFiles.entity';
import { Base } from './index.entity';
import { IsNotEmpty, IsNumber } from 'class-validator';

@Entity('feed_uploadFiles')
export class FeedUploadFiles extends Base {
  @ManyToOne(type => Feed, feeds => feeds.feedUploadFiles, { nullable: false })
  feed: Feed;

  @RelationId((feedUploadFiles: FeedUploadFiles) => feedUploadFiles.feed)
  @IsNotEmpty()
  @IsNumber()
  feedId: number;

  @ManyToOne(
    type => UploadFiles,
    upload_files => upload_files.feedUploadFiles,
    {
      nullable: false,
    }
  )
  uploadFiles: UploadFiles;

  @RelationId((feedUploadFiles: FeedUploadFiles) => feedUploadFiles.uploadFiles)
  @IsNotEmpty()
  @IsNumber()
  uploadFilesId: number;
}
