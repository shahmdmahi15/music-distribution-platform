import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class LogoutDto {
  @IsNotEmpty({ message: 'Session token is required.' })
  @IsString({ message: 'Session token must be a string.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value),
  )
  token!: string;
}
