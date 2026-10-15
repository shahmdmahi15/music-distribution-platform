import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReleaseStatus } from 'src/generated/prisma/client';

export class AdminDistributionQueryDto {
  @IsString()
  @IsOptional()
  whiteLabelId?: string;

  @IsEnum(ReleaseStatus)
  @IsOptional()
  status?: ReleaseStatus;

  @IsString()
  @IsOptional()
  search?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
