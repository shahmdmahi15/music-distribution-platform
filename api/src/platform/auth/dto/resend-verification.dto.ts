import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class ResendVerificationDto {
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Email must be a valid email address.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value),
  )
  email!: string;
}
