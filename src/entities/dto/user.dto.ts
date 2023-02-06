import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  nickname?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(20)
  // @Matches(/^[a-zA-Z0-9]*$/, {
  //   message: 'password only accepts english and number',
  // })
  // TODO 정규식 살펴보기
  @Matches(/^.*(?=^.{8,}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/, {
    message: 'password only accepts english and number 그리고 특수기호',
  })
  password?: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(50)
  email?: string;
}
