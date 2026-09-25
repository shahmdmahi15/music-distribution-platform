import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { WhiteLabelSignupModel } from 'src/generated/prisma/enums';

export class ClientSetupWhiteLabelDto {
  @IsNotEmpty({ message: 'Brand name is required.' })
  @IsString({ message: 'Brand name must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MaxLength(200)
  tagline?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MaxLength(1000)
  description?: string;

  @IsNotEmpty({ message: 'Support email is required.' })
  @IsEmail({}, { message: 'Support email must be a valid email address.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : (value as unknown),
  )
  supportEmail!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MaxLength(32)
  supportPhone?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MaxLength(200)
  copyrightText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  accentColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  themeMode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  themeRadius?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  themeFont?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cardStyle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  navbarStyle?: string;

  @IsOptional()
  @IsEnum(WhiteLabelSignupModel, {
    message:
      'Registration model must be INVITE_ONLY, ADMIN_APPROVAL, or OPEN_REGISTRATION.',
  })
  userSignupModel?: WhiteLabelSignupModel;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  logoDarkUrl?: string;

  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  // Initial Super Admin / Owner Account Setup
  @IsOptional()
  @IsEmail({}, { message: 'Owner email must be a valid email address.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : (value as unknown),
  )
  ownerEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, {
    message: 'Owner password must be at least 8 characters long.',
  })
  ownerPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  ownerFirstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  ownerLastName?: string;

  // Social Links
  @IsOptional()
  @IsString()
  socialInstagram?: string;

  @IsOptional()
  @IsString()
  socialTwitter?: string;

  @IsOptional()
  @IsString()
  socialYoutube?: string;

  @IsOptional()
  @IsString()
  socialSpotify?: string;

  @IsOptional()
  @IsString()
  socialFacebook?: string;

  @IsOptional()
  @IsString()
  socialLinkedin?: string;

  @IsOptional()
  @IsString()
  socialTiktok?: string;

  // Optional Infrastructure & Domain Configuration
  @IsOptional()
  @IsString()
  customDomain?: string;

  @IsOptional()
  @IsString()
  bucketName?: string;

  @IsOptional()
  @IsString()
  elasticIpv4?: string;

  @IsOptional()
  @IsString()
  cloudflareZoneId?: string;

  @IsOptional()
  @IsString()
  cloudflareBaseDomain?: string;

  @IsOptional()
  @IsString()
  awsRegion?: string;

  @IsOptional()
  @IsString()
  awsInstanceType?: string;

  @IsOptional()
  @IsString()
  senderEmail?: string;
}
