import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlatformUserRole } from 'src/generated/prisma/enums';

export class BulkLockPlatformUsersDto {
  @IsArray({ message: 'userIds must be an array of user IDs.' })
  @ArrayNotEmpty({ message: 'Please select at least one user.' })
  @IsString({ each: true, message: 'Each user ID must be a string.' })
  userIds!: string[];

  @IsNotEmpty({ message: 'locked flag is required.' })
  @IsBoolean({ message: 'locked must be a boolean.' })
  locked!: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'lockMinutes must be an integer.' })
  @Min(1, { message: 'lockMinutes must be at least 1 minute.' })
  lockMinutes?: number;
}

export class BulkRolePlatformUsersDto {
  @IsArray({ message: 'userIds must be an array of user IDs.' })
  @ArrayNotEmpty({ message: 'Please select at least one user.' })
  @IsString({ each: true, message: 'Each user ID must be a string.' })
  userIds!: string[];

  @IsNotEmpty({ message: 'role is required.' })
  @IsEnum(PlatformUserRole, {
    message: 'role must be a valid PlatformUserRole.',
  })
  role!: PlatformUserRole;
}

export class BulkActionPlatformUsersDto {
  @IsArray({ message: 'userIds must be an array of user IDs.' })
  @ArrayNotEmpty({ message: 'Please select at least one user.' })
  @IsString({ each: true, message: 'Each user ID must be a string.' })
  userIds!: string[];
}
