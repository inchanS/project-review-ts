import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class FeedDto {
  @IsNotEmpty()
  @IsNumber()
  user: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(250)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(10000)
  content: string;

  @IsNotEmpty()
  @IsNumber()
  estimation: number;

  @IsNotEmpty()
  @IsNumber()
  category: number;

  @IsOptional()
  @IsNumber()
  status?: number;

  @IsOptional()
  posted_at?: Date;

  constructor(
    user: number,
    title: string,
    content: string,
    estimation: number,
    category: number
  ) {
    this.user = user;
    this.title = title;
    this.content = content;
    this.estimation = estimation;
    this.category = category;
  }
}
