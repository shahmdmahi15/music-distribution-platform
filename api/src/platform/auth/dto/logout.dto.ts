import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  @IsNotEmpty({ message: 'Session token is required.' })
  @IsString({ message: 'Session token must be a string.' })
  token!: string;
}
