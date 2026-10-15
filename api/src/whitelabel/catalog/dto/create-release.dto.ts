import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReleaseType, ContributorRole } from 'src/generated/prisma/client';

export class ReleaseContributorDto {
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

export class CreateReleaseDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsEnum(ReleaseType)
  @IsOptional()
  type?: ReleaseType = ReleaseType.SINGLE;

  @IsString()
  @IsNotEmpty()
  genre!: string;

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
