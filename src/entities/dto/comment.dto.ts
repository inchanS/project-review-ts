import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Comment } from '../comment.entity';

export class CommentDto {
  @IsNotEmpty()
  @IsNumber()
  user?: number;

  @IsNotEmpty()
  @IsNumber()
  feed?: number;

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
  parent?: Comment;
}
