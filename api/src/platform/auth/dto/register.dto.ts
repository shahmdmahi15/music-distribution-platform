import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class RegisterDto {
  @IsNotEmpty({ message: 'First name is required.' })
  @IsString({ message: 'First name must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(2, { message: 'First name must be at least 2 characters long.' })
  @MaxLength(64, { message: 'First name must be at most 64 characters long.' })
  firstName!: string;

  @IsNotEmpty({ message: 'Last name is required.' })
  @IsString({ message: 'Last name must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(2, { message: 'Last name must be at least 2 characters long.' })
  @MaxLength(64, { message: 'Last name must be at most 64 characters long.' })
  lastName!: string;

  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Email must be a valid email address.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  email!: string;

  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(64, { message: 'Password must be at most 64 characters long.' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?=.*[a-z])(?=.*[A-Z]).*$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character.',
  })
  password!: string;
}
