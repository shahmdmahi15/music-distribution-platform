import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type, Transform, TransformFnParams } from 'class-transformer';
import {
  WhiteLabelBusinessType,
  WhiteLabelSignupModel,
} from 'src/generated/prisma/enums';

export class CreateTopArtistDto {
  @IsNotEmpty({ message: 'Artist name is required.' })
  @IsString({ message: 'Artist name must be a string.' })
  @MaxLength(128, { message: 'Artist name must not exceed 128 characters.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  artistName!: string;

  @IsOptional()
  @IsString({ message: 'Instagram handle must be a string.' })
  @MaxLength(128)
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  instagramHandle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  spotifyProfileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  youtubeChannelUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  monthlyListeners?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  orderIndex?: number;
}

export class CreateWhiteLabelDto {
  // Company Name
  @IsNotEmpty({ message: 'Company name is required.' })
  @IsString({ message: 'Company name must be a string.' })
  @MaxLength(128, { message: 'Company name must not exceed 128 characters.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  // Business Type
  @IsNotEmpty({ message: 'Business type is required.' })
  @IsEnum(WhiteLabelBusinessType, {
    message:
      'Business type must be RECORD_LABEL, DISTRIBUTOR_AGGREGATOR, MUSIC_PUBLISHER, or OTHER.',
  })
  businessType!: WhiteLabelBusinessType;

  // Company Website
  @IsOptional()
  @IsString()
  @MaxLength(256)
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  companyWebsite?: string;

  // Country/Region
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  country?: string;

  // Years in business
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  @Type(() => Number)
  yearsInBusiness?: number;

  // Is business incorporated?
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isIncorporated?: boolean;

  // Incorporation document attachment
  @IsOptional()
  @IsString()
  @MaxLength(512)
  incorporationDocUrl?: string;

  // Contact First Name
  @IsNotEmpty({ message: 'First name is required.' })
  @IsString()
  @MaxLength(64)
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  contactFirstName!: string;

  // Contact Last Name
  @IsNotEmpty({ message: 'Last name is required.' })
  @IsString()
  @MaxLength(64)
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  contactLastName!: string;

  // Contact Email
  @IsNotEmpty({ message: 'Email address is required.' })
  @IsEmail({}, { message: 'Please provide a valid contact email address.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  contactEmail!: string;

  // LinkedIn Handle / Profile
  @IsOptional()
  @IsString()
  @MaxLength(256)
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  contactLinkedIn?: string;

  // Catalog track count
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  catalogTrackCount?: number;

  // Monthly tracks delivered
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  monthlyTrackDelivery?: number;

  // Average monthly catalog revenue ($)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  monthlyRevenueUsd?: number;

  // Do you have direct deals?
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasDirectDeals?: boolean;

  // Currently used distributors
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentDistributors?: string[];

  // Existing royalty solutions
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  royaltySolutions?: string[];

  // Primary Catalog Language
  @IsOptional()
  @IsString()
  @MaxLength(32)
  primaryCatalogLanguage?: string;

  // Are you migrating your catalog?
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  wantsCatalogMigration?: boolean;

  // Does your catalog have sample based covers?
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasSampleBasedCovers?: boolean;

  // How will users sign up to your business?
  @IsOptional()
  @IsEnum(WhiteLabelSignupModel, {
    message:
      'Signup model must be OPEN_PUBLIC, INVITE_ONLY, VETTED_APPLICATION, or MANUAL_APPROVAL.',
  })
  userSignupModel?: WhiteLabelSignupModel;

  // Privacy Policy Acceptance
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  privacyPolicyAccepted?: boolean;

  // Marketing Consent
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  marketingConsent?: boolean;

  // Top artists in roster (up to 3 or more)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTopArtistDto)
  topArtists?: CreateTopArtistDto[];
}
