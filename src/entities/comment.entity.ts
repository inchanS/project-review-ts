import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './users.entity';
import { Feed } from './feed.entity';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(type => User, users => users.id, { nullable: false })
  @IsNotEmpty()
  @IsNumber()
  user: number;

  @ManyToOne(type => Feed, feeds => feeds.id, { nullable: false })
  @IsNotEmpty()
  @IsNumber()
  feed: number;

  @Column({ length: 1000 })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @Column('int')
  @IsNumber()
  reply_id: number;

  @Column('boolean', { default: false })
  is_private: boolean;

  @Column('boolean', { default: false })
  is_deleted: boolean;

  @CreateDateColumn({
    type: 'datetime',
  })
  public created_at?: Date;

  @UpdateDateColumn({
    type: 'datetime',
  })
  public updated_at?: Date;
}
