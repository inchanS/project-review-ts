import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Comment } from '../comment.entity';
import { User } from '../users.entity';
import { Feed } from '../feed.entity';

export class CommentDto {
  @IsNotEmpty()
  @IsNumber()
  user: User;

  @IsNotEmpty()
  @IsNumber()
  feed: Feed;

  @IsNotEmpty()
  @IsString()
  comment: string;

  @IsBoolean()
  @IsOptional()
  is_private: boolean;

  @IsBoolean()
  @IsOptional()
  is_deleted?: boolean;

  @IsNumber()
  @IsOptional()
  parent: Comment;
}
