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
  @MinLength(8)
  @MaxLength(20)
  // @Matches(/^[a-zA-Z0-9]*$/, {
  //   message: 'password only accepts english and number',
  // })
  @Matches(
    /^.*(?=^.{8,20}$)(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&+=]).*$/,
    {
      message: 'password only accepts english and number 그리고 특수기호',
    }
  )
  password?: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(50)
  email?: string;
}
