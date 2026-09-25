import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { WhiteLabelUserRole } from 'src/generated/prisma/client';

export class CreateClientPortalUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(60)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(60)
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsEnum(WhiteLabelUserRole)
  role?: WhiteLabelUserRole;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(100)
  password?: string;
}

export class UpdateClientPortalUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  lastName?: string;

  @IsOptional()
  @IsEnum(WhiteLabelUserRole)
  role?: WhiteLabelUserRole;
}

export class ResetClientPortalUserPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(100)
  password: string;
}
