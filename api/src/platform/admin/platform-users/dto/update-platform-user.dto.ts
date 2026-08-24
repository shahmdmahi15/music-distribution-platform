import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { PlatformUserRole } from 'src/generated/prisma/enums';

export class UpdatePlatformUserDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(2, { message: 'First name must be at least 2 characters long.' })
  @MaxLength(64, { message: 'First name must be at most 64 characters long.' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(2, { message: 'Last name must be at least 2 characters long.' })
  @MaxLength(64, { message: 'Last name must be at most 64 characters long.' })
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;

  @IsOptional()
  @IsEnum(PlatformUserRole, {
    message: 'Role must be a valid PlatformUserRole.',
  })
  role?: PlatformUserRole;

  @IsOptional()
  @IsBoolean({ message: 'emailVerified must be a boolean.' })
  emailVerified?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'twoFactorEnabled must be a boolean.' })
  twoFactorEnabled?: boolean;
}
