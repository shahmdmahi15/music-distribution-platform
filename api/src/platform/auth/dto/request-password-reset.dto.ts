import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class RequestPasswordResetDto {
  @IsNotEmpty({ message: 'Email address is required.' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value),
  )
  email!: string;
}
