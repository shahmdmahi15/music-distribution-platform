import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type, Transform, TransformFnParams } from 'class-transformer';
import {
  WhiteLabelBusinessType,
  WhiteLabelSignupModel,
  WhiteLabelStatus,
} from 'src/generated/prisma/enums';

export class UpdateWhiteLabelDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @IsOptional()
  @IsEnum(WhiteLabelBusinessType)
  businessType?: WhiteLabelBusinessType;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  companyWebsite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  country?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  @Type(() => Number)
  yearsInBusiness?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isIncorporated?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  incorporationDocUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  contactFirstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  contactLastName?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  contactLinkedIn?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  catalogTrackCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  monthlyTrackDelivery?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  monthlyRevenueUsd?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasDirectDeals?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentDistributors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  royaltySolutions?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(32)
  primaryCatalogLanguage?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  wantsCatalogMigration?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasSampleBasedCovers?: boolean;

  @IsOptional()
  @IsEnum(WhiteLabelSignupModel)
  userSignupModel?: WhiteLabelSignupModel;

  @IsOptional()
  @IsEnum(WhiteLabelStatus)
  status?: WhiteLabelStatus;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  statusReason?: string;
}
