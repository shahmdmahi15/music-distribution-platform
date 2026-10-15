import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDistributionReportDto {
  @IsString()
  @IsNotEmpty()
  whiteLabelId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  reportingPeriod!: string; // e.g. 2026-03

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  totalRevenueBdt?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  totalRevenueUsd?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  totalStreams?: number;

  @IsString()
  @IsNotEmpty()
  fileKey!: string;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  fileSizeBytes?: number;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
