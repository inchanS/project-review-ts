import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class TempFeedDto {
  @IsNotEmpty()
  @IsNumber()
  user: number;

  @IsString()
  @MinLength(2)
  @MaxLength(250)
  @IsOptional()
  title: string;

  @IsString()
  @MaxLength(10000)
  @IsOptional()
  content: string;

  @IsNumber()
  @IsOptional()
  estimation: number;

  @IsNumber()
  @IsOptional()
  category: number;

  @IsNumber()
  @IsOptional()
  status?: number;
}
