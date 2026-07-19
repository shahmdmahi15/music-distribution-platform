import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Email must be a valid email address.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value),
  )
  email!: string;

  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value),
  )
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(64, { message: 'Password must be at most 64 characters long.' })
  password!: string;
}
