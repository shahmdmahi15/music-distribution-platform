import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReferrerStatus } from 'src/generated/prisma/enums';

export enum ReferrerSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
  STATUS = 'status',
  COMMISSION_RATE = 'commissionRate',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

const SORT_BY_PATTERN = new RegExp(
  `^(${Object.values(ReferrerSortBy).join('|')}):(${Object.values(SortOrder).join('|')})$`,
);

export class AdminReferrerQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ReferrerStatus)
  status?: ReferrerStatus;

  @IsOptional()
  @IsString()
  payoutMethod?: string;

  @IsOptional()
  @Matches(SORT_BY_PATTERN, {
    message: `sortBy must be one of ${Object.values(ReferrerSortBy).join(', ')} followed by :asc or :desc.`,
  })
  sortBy?: string = 'createdAt:desc';
}
