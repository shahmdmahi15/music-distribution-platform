import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(1, { message: 'First name cannot be empty.' })
  @MaxLength(50, { message: 'First name must be at most 50 characters.' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(1, { message: 'Last name cannot be empty.' })
  @MaxLength(50, { message: 'Last name must be at most 50 characters.' })
  lastName?: string;
}
