import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type, Transform, TransformFnParams } from 'class-transformer';
import { PlatformUserRole } from 'src/generated/prisma/enums';

export enum UserStatusFilter {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  VERIFIED = 'VERIFIED',
  UNVERIFIED = 'UNVERIFIED',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',
}

export enum UserSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_LOGIN_AT = 'lastLoginAt',
  EMAIL = 'email',
  FIRST_NAME = 'firstName',
  ROLE = 'role',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetPlatformUsersDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @IsOptional()
  @IsEnum(PlatformUserRole, {
    message: 'Role must be a valid PlatformUserRole.',
  })
  role?: PlatformUserRole;

  @IsOptional()
  @IsEnum(UserStatusFilter, {
    message: 'Status must be a valid UserStatusFilter.',
  })
  status?: UserStatusFilter;

  @IsOptional()
  @IsEnum(UserSortBy, {
    message: 'sortBy must be one of createdAt, updatedAt, lastLoginAt, email, firstName, role.',
  })
  sortBy?: UserSortBy = UserSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder, {
    message: 'sortOrder must be asc or desc.',
  })
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
