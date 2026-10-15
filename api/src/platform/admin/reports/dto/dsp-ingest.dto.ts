import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DspStore } from 'src/generated/prisma/client';

export class DspIngestDto {
  @IsEnum(DspStore)
  @IsNotEmpty()
  store: DspStore;

  @IsString()
  @IsNotEmpty()
  reportingPeriod: string; // e.g. "2026-03"

  @IsString()
  @IsOptional()
  fileContent?: string;
}
