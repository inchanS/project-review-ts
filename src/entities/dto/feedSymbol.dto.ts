import { IsNotEmpty, IsNumber } from 'class-validator';

export class FeedSymbolDto {
  @IsNotEmpty()
  @IsNumber()
  user: number;

  @IsNotEmpty()
  @IsNumber()
  feed: number;

  @IsNotEmpty()
  @IsNumber()
  symbol: number;
}
