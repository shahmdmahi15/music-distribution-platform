import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContributorRole } from 'src/generated/prisma/client';

export class TrackContributorDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(ContributorRole)
  @IsOptional()
  role?: ContributorRole = ContributorRole.PRIMARY_ARTIST;

  @IsString()
  @IsOptional()
  spotifyId?: string;

  @IsString()
  @IsOptional()
  appleMusicId?: string;
}

export class CreateTrackDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  trackNumber?: number = 1;

  @IsInt()
  @Min(1)
  @IsOptional()
  discNumber?: number = 1;

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
  explicit?: boolean = false;

  @IsString()
  @IsNotEmpty()
  audioKey!: string;

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
  language?: string = 'en';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackContributorDto)
  @IsOptional()
  contributors?: TrackContributorDto[];
}
