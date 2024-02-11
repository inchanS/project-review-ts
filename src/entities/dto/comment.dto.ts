import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

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
  parent?: number;

  constructor(comment: string, is_private: boolean) {
    this.comment = comment;
    this.is_private = is_private;
  }
}
