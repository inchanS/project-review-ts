import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Feed } from './feed.entity';
import { UploadFiles } from './uploadFiles.entity';

@Entity('feed_uploadFiles')
export class FeedUploadFiles {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Feed, feeds => feeds.id, { nullable: false })
  feed: number;

  @ManyToOne(type => UploadFiles, upload_files => upload_files.id, {
    nullable: false,
  })
  upload_files: number;

  @CreateDateColumn({
    type: 'datetime',
  })
  public created_at?: Date;

  @UpdateDateColumn({
    type: 'datetime',
  })
  public updated_at?: Date;
}
