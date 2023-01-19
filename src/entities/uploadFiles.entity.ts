import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('upload_files')
export class UploadFiles {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('boolean', { default: true })
  is_img: boolean;

  @Column({ length: 500 })
  file_link: string;

  @CreateDateColumn({
    type: 'datetime',
  })
  public created_at?: Date;

  @UpdateDateColumn({
    type: 'datetime',
  })
  public updated_at?: Date;
}
