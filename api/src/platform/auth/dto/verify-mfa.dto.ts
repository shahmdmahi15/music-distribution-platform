import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class VerifyMfaDto {
  @IsNotEmpty({ message: 'User id is required.' })
  @IsString({ message: 'User id must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  userId!: string;

  @IsNotEmpty({ message: 'Code is required.' })
  @IsString({ message: 'Code must be a string.' })
  @Length(6, 6, { message: 'The 2FA code must be exactly 6 digits.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  code!: string;
}
