import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  WhiteLabelBusinessType,
  WhiteLabelStatus,
} from 'src/generated/prisma/enums';

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
  @IsString()
  sortBy?: string = 'createdAt:desc';
}
