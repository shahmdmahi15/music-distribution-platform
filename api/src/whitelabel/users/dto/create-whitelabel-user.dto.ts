import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { WhiteLabelUserRole } from 'src/generated/prisma/enums';

export class CreateWhitelabelUserDto {
  @IsNotEmpty({ message: 'First name is required.' })
  @IsString({ message: 'First name must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(2)
  @MaxLength(64)
  firstName!: string;

  @IsNotEmpty({ message: 'Last name is required.' })
  @IsString({ message: 'Last name must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(2)
  @MaxLength(64)
  lastName!: string;

  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Email must be a valid email address.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : (value as unknown),
  )
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password?: string;

  @IsNotEmpty({ message: 'Role is required.' })
  @IsEnum(WhiteLabelUserRole, { message: 'Invalid role specified.' })
  role!: WhiteLabelUserRole;
}
