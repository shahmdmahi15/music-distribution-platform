import { IsNotEmpty, IsString, Length } from 'class-validator';

export class Verify2faDto {
  @IsNotEmpty({ message: 'User id is required.' })
  @IsString({ message: 'User id must be a string.' })
  userId!: string;

  @IsNotEmpty({ message: 'Code is required.' })
  @IsString({ message: 'Code must be a string.' })
  @Length(6, 6, { message: 'The 2FA code must be exactly 6 digits.' })
  code!: string;
}
