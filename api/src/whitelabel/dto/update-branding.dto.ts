import {
  IsHexColor,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateBrandingDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'Subdomain can only contain lowercase letters, numbers, and hyphens.',
  })
  @MaxLength(40)
  subdomain?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customDomain?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  accentColor?: string;

  @IsOptional()
  @IsString()
  supportEmail?: string;

  @IsOptional()
  @IsString()
  supportPhone?: string;

  @IsOptional()
  @IsString()
  copyrightText?: string;

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
}
