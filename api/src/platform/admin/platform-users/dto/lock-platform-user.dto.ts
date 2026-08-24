import { IsBoolean, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LockPlatformUserDto {
  @IsNotEmpty({ message: 'locked flag is required.' })
  @IsBoolean({ message: 'locked must be a boolean.' })
  locked!: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'lockMinutes must be an integer.' })
  @Min(1, { message: 'lockMinutes must be at least 1 minute.' })
  lockMinutes?: number;
}
