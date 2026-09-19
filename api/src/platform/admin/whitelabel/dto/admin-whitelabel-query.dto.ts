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
import {
  WhiteLabelBusinessType,
  WhiteLabelStatus,
} from 'src/generated/prisma/enums';

/** Columns the admin list may be ordered by. */
export enum WhiteLabelSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
  STATUS = 'status',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// `sortBy` becomes a Prisma `orderBy` key, so it must never accept a free-form
// string.
const SORT_BY_PATTERN = new RegExp(
  `^(${Object.values(WhiteLabelSortBy).join('|')}):(${Object.values(SortOrder).join('|')})$`,
);

export class AdminWhiteLabelQueryDto {
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
  @IsEnum(WhiteLabelStatus)
  status?: WhiteLabelStatus;

  @IsOptional()
  @IsEnum(WhiteLabelBusinessType)
  businessType?: WhiteLabelBusinessType;

  @IsOptional()
  @Matches(SORT_BY_PATTERN, {
    message: `sortBy must be one of ${Object.values(WhiteLabelSortBy).join(', ')} followed by :asc or :desc.`,
  })
  sortBy?: string = 'createdAt:desc';
}
