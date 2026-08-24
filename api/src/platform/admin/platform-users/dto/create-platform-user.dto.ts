import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { PlatformUserRole } from 'src/generated/prisma/enums';

export class CreatePlatformUserDto {
  @IsNotEmpty({ message: 'First name is required.' })
  @IsString({ message: 'First name must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(2, { message: 'First name must be at least 2 characters long.' })
  @MaxLength(64, { message: 'First name must be at most 64 characters long.' })
  firstName!: string;

  @IsNotEmpty({ message: 'Last name is required.' })
  @IsString({ message: 'Last name must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(2, { message: 'Last name must be at least 2 characters long.' })
  @MaxLength(64, { message: 'Last name must be at most 64 characters long.' })
  lastName!: string;

  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(128, { message: 'Password must be at most 128 characters long.' })
  password!: string;

  @IsNotEmpty({ message: 'Role is required.' })
  @IsEnum(PlatformUserRole, {
    message: 'Role must be a valid PlatformUserRole.',
  })
  role!: PlatformUserRole;

  @IsOptional()
  @IsBoolean({ message: 'emailVerified must be a boolean.' })
  emailVerified?: boolean = true;

  @IsOptional()
  @IsBoolean({ message: 'twoFactorEnabled must be a boolean.' })
  twoFactorEnabled?: boolean = false;
}
