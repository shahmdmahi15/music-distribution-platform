import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReleaseStatus } from 'src/generated/prisma/client';

export class QueryClientReleasesDto {
  @IsOptional()
  @IsEnum(ReleaseStatus)
  status?: ReleaseStatus;

  @IsOptional()
  @IsString()
  search?: string;

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
  limit: number = 20;
}

export class RejectReleaseDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class RejectChannelDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}
