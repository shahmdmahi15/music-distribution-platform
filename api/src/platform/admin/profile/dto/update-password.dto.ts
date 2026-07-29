import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class UpdatePasswordDto {
  @IsNotEmpty({ message: 'Current password is required.' })
  @IsString({ message: 'Current password must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(8, {
    message: 'Current password must be at least 8 characters long.',
  })
  @MaxLength(64, {
    message: 'Current password must be at most 64 characters long.',
  })
  currentPassword!: string;

  @IsNotEmpty({ message: 'New password is required.' })
  @IsString({ message: 'New password must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(8, {
    message: 'New password must be at least 8 characters long.',
  })
  @MaxLength(64, {
    message: 'New password must be at most 64 characters long.',
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?=.*[a-z])(?=.*[A-Z]).*$/, {
    message:
      'New password must contain at least one uppercase letter, one lowercase letter, and one number or special character.',
  })
  newPassword!: string;
}
