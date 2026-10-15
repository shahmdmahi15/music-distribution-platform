import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReleaseType } from 'src/generated/prisma/client';
import { ReleaseContributorDto } from './create-release.dto';

export class UpdateReleaseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(ReleaseType)
  @IsOptional()
  type?: ReleaseType;

  @IsString()
  @IsOptional()
  genre?: string;

  @IsString()
  @IsOptional()
  subgenre?: string;

  @IsString()
  @IsOptional()
  upc?: string;

  @IsString()
  @IsOptional()
  catalogNumber?: string;

  @IsString()
  @IsOptional()
  releaseDate?: string;

  @IsString()
  @IsOptional()
  originalReleaseDate?: string;

  @IsString()
  @IsOptional()
  labelName?: string;

  @IsString()
  @IsOptional()
  cLine?: string;

  @IsString()
  @IsOptional()
  pLine?: string;

  @IsString()
  @IsOptional()
  coverArtKey?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  videoVersion?: any;

  @IsString()
  @IsOptional()
  vevoChannelName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReleaseContributorDto)
  @IsOptional()
  contributors?: ReleaseContributorDto[];
}
