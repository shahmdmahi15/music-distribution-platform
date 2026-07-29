import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class UpdateProfileNameDto {
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
}
