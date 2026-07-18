import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PasswordResetDto {
  @IsNotEmpty({ message: 'Reset Password token is required.' })
  @IsString({ message: 'Reset Password token must be a string.' })
  token!: string;

  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(64, { message: 'Password must be at most 64 characters long.' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?=.*[a-z])(?=.*[A-Z]).*$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character.',
  })
  newPassword!: string;
}
