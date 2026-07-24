import { IsNotEmpty, IsString } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class VerifyDto {
  @IsNotEmpty({ message: 'Verification token is required.' })
  @IsString({ message: 'Verification token must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  token!: string;
}
