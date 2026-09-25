import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class ValidateCloudCredentialsDto {
  @IsNotEmpty({ message: 'AWS Region is required.' })
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @Matches(/^[a-z]{2}-[a-z]+-\d$/, {
    message:
      'AWS Region must be in valid format (e.g. us-east-1, ap-southeast-1).',
  })
  awsRegion!: string;

  @IsNotEmpty({ message: 'AWS Access Key ID is required.' })
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(16)
  @MaxLength(128)
  awsAccessKeyId!: string;

  @IsNotEmpty({ message: 'AWS Secret Access Key is required.' })
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(16)
  awsSecretAccessKey!: string;

  @IsNotEmpty({ message: 'Cloudflare API Token is required.' })
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(20)
  cloudflareApiToken!: string;

  @IsNotEmpty({ message: 'Cloudflare Zone ID is required.' })
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @MinLength(16)
  @MaxLength(64)
  cloudflareZoneId!: string;

  @IsNotEmpty({ message: 'Cloudflare Base Domain is required.' })
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : (value as unknown),
  )
  @MinLength(3)
  cloudflareBaseDomain!: string;
}

export class StartCloudProvisioningDto extends ValidateCloudCredentialsDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : (value as unknown),
  )
  @MaxLength(63)
  bucketName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Sender email must be a valid email address.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : (value as unknown),
  )
  senderEmail?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  instanceType?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : (value as unknown),
  )
  customDomain?: string;
}
