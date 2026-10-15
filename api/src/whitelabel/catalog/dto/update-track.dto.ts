import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TrackContributorDto } from './create-track.dto';

export class UpdateTrackDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  trackNumber?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  discNumber?: number;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  isrc?: string;

  @IsString()
  @IsOptional()
  iswc?: string;

  @IsInt()
  @IsOptional()
  durationSeconds?: number;

  @IsBoolean()
  @IsOptional()
  explicit?: boolean;

  @IsString()
  @IsOptional()
  audioKey?: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsInt()
  @IsOptional()
  fileSizeBytes?: number;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsString()
  @IsOptional()
  lyrics?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackContributorDto)
  @IsOptional()
  contributors?: TrackContributorDto[];
}
