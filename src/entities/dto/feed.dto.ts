import { User } from '../users.entity';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Estimation } from '../estimation.entity';
import { Category } from '../category.entity';
import { FeedStatus } from '../feedStatus.entity';

export class FeedDto {
  @IsNotEmpty()
  @IsNumber()
  user: User;

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
  estimation: Estimation;

  @IsNotEmpty()
  @IsNumber()
  category: Category;

  @IsNotEmpty()
  @IsNumber()
  status: FeedStatus;
}
