import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  WhiteLabelBusinessType,
  WhiteLabelSignupModel,
} from 'src/generated/prisma/client';

export class AdminUpdateApplicationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(WhiteLabelBusinessType)
  businessType?: WhiteLabelBusinessType;

  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearsInBusiness?: number;

  @IsOptional()
  @IsBoolean()
  isIncorporated?: boolean;

  @IsOptional()
  @IsString()
  incorporationDocUrl?: string;

  @IsOptional()
  @IsString()
  contactFirstName?: string;

  @IsOptional()
  @IsString()
  contactLastName?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactLinkedIn?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  catalogTrackCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyTrackDelivery?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyRevenueUsd?: number;

  @IsOptional()
  @IsString()
  primaryCatalogLanguage?: string;

  @IsOptional()
  @IsBoolean()
  hasDirectDeals?: boolean;

  @IsOptional()
  @IsBoolean()
  wantsCatalogMigration?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSampleBasedCovers?: boolean;

  @IsOptional()
  @IsEnum(WhiteLabelSignupModel)
  userSignupModel?: WhiteLabelSignupModel;

  @IsOptional()
  @IsString()
  subdomain?: string;

  @IsOptional()
  @IsString()
  customDomain?: string;

  @IsOptional()
  @IsString()
  elasticIpv4?: string;

  @IsOptional()
  @IsObject()
  onboardingDetails?: Record<string, any>;

  @IsOptional()
  @IsString()
  statusReason?: string;
}
