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

  constructor(user: number, feed: number, symbol: number) {
    this.user = user;
    this.feed = feed;
    this.symbol = symbol;
  }
}
