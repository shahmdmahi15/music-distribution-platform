import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsIP,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { WhiteLabelSignupModel } from 'src/generated/prisma/client';

export class UpdateThemeDto {
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  accentColor?: string;

  @IsOptional()
  @IsString()
  radius?: string;

  @IsOptional()
  @IsEnum(['light', 'dark', 'system'])
  mode?: 'light' | 'dark' | 'system';

  @IsOptional()
  @IsString()
  fontFamily?: string;

  @IsOptional()
  @IsEnum(['modern', 'glass', 'flat', 'bordered'])
  cardStyle?: 'modern' | 'glass' | 'flat' | 'bordered';

  @IsOptional()
  @IsEnum(['solid', 'glass', 'floating'])
  navbarStyle?: 'solid' | 'glass' | 'floating';
}

export class UpdateDomainDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/i, {
    message:
      'Subdomain must be lowercase alphanumeric with hyphens (e.g., mylabel)',
  })
  subdomain?: string;

  @IsOptional()
  @ValidateIf((o) => o.customDomain !== '' && o.customDomain !== null && o.customDomain !== undefined)
  @IsString()
  @Matches(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, {
    message: 'Custom domain must be a valid FQDN (e.g., catalog.example.com)',
  })
  customDomain?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.elasticIpv4 !== '' && o.elasticIpv4 !== null && o.elasticIpv4 !== undefined)
  @IsString()
  @IsIP(4, { message: 'Must be a valid IPv4 address (e.g. 54.210.12.34)' })
  elasticIpv4?: string | null;
}

export class UpdateSsoDto {
  @IsOptional()
  @IsEnum(WhiteLabelSignupModel)
  userSignupModel?: WhiteLabelSignupModel;

  @IsOptional()
  @IsBoolean()
  googleEnabled?: boolean;

  @IsOptional()
  @IsString()
  googleClientId?: string;

  @IsOptional()
  @IsString()
  googleClientSecret?: string;

  @IsOptional()
  @IsBoolean()
  githubEnabled?: boolean;

  @IsOptional()
  @IsString()
  githubClientId?: string;

  @IsOptional()
  @IsString()
  githubClientSecret?: string;

  @IsOptional()
  @IsBoolean()
  enforce2fa?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(720)
  sessionTimeoutHours?: number;

  // Infrastructure & Cloud Credentials
  @IsOptional()
  @IsString()
  awsRegion?: string;

  @IsOptional()
  @IsString()
  awsAccessKeyId?: string;

  @IsOptional()
  @IsString()
  awsSecretAccessKey?: string;

  @IsOptional()
  @IsString()
  bucketName?: string;

  @IsOptional()
  @IsString()
  senderEmail?: string;

  @IsOptional()
  @IsString()
  databaseUrl?: string;

  @IsOptional()
  @IsString()
  redisUrl?: string;

  @IsOptional()
  @IsString()
  cloudflareApiToken?: string;

  @IsOptional()
  @IsString()
  cloudflareZoneId?: string;

  @IsOptional()
  @IsString()
  cloudflareBaseDomain?: string;
}

export class TestCredentialsDto {
  @IsEnum(['aws_s3', 'aws_ses', 'database', 'redis', 'cloudflare'], {
    message: 'type must be one of: aws_s3, aws_ses, database, redis, cloudflare',
  })
  type!: 'aws_s3' | 'aws_ses' | 'database' | 'redis' | 'cloudflare';
}

export class CreateApiKeyDto {
  @IsString()
  @Length(3, 50)
  name!: string;

  @IsArray()
  @IsString({ each: true })
  scopes!: string[];
}

export class UpdateWebhookDto {
  @IsUrl({ require_tld: false, require_protocol: true })
  url!: string;

  @IsArray()
  @IsString({ each: true })
  events!: string[];

  @IsBoolean()
  isActive!: boolean;
}

export class TestWebhookDto {
  @IsOptional()
  @IsString()
  eventType?: string;
}
