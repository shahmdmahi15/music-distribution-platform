import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyMfaDto {
  @IsNotEmpty({ message: 'Two-factor challenge token is required.' })
  @IsString({ message: 'Two-factor challenge token must be a string.' })
  mfaToken!: string;

  @IsNotEmpty({ message: 'Verification code is required.' })
  @IsString({ message: 'Verification code must be a string.' })
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits.' })
  code!: string;
}
