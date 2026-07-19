import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyDto {
  @IsNotEmpty({ message: 'Verification token is required.' })
  @IsString({ message: 'Verification token must be a string.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value),
  )
  token!: string;
}
