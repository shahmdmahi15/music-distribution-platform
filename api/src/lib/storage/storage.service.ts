import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  PutPublicAccessBlockCommand,
  PutBucketPolicyCommand,
  PutBucketCorsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/config/env.config';

export interface UploadOptions {
  cacheControl?: string;
}

/** Lifetime of signed URLs for private objects, in seconds. */
export const DOCUMENT_URL_TTL_SECONDS = 900;

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client!: S3Client;
  private bucketName!: string;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  onModuleInit() {
    const region = this.configService.get('AWS_REGION', { infer: true });
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID', {
      infer: true,
    });
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY', {
      infer: true,
    });

    this.bucketName = this.configService.get('AWS_S3_BUCKET', { infer: true });

    this.s3Client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    // Ensure public assets (branding, public media) are accessible while private vault documents remain locked
    this.ensureBucketPublicMediaPolicyAndCors().catch((err) => {
      this.logger.warn(
        `Failed to auto-verify S3 bucket policy and CORS: ${err?.message || err}`,
      );
    });
  }

  /**
   * Automatically configures S3 public access block, bucket policy, and CORS for public media
   * such as brand logos, favicons, banners, and public covers, while strictly protecting private files.
   */
  async ensureBucketPublicMediaPolicyAndCors(): Promise<void> {
    if (!this.bucketName) return;

    try {
      // 1. Enable Public Bucket Policies while maintaining ACL protections
      await this.s3Client.send(
        new PutPublicAccessBlockCommand({
          Bucket: this.bucketName,
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            IgnorePublicAcls: true,
            BlockPublicPolicy: false,
            RestrictPublicBuckets: false,
          },
        }),
      );

      // 2. Set Bucket Policy allowing public s3:GetObject ONLY on public/branding asset paths
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowPublicReadForBrandingAndMedia',
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: [
              `arn:aws:s3:::${this.bucketName}/whitelabels/*/branding/*`,
              `arn:aws:s3:::${this.bucketName}/public/*`,
              `arn:aws:s3:::${this.bucketName}/covers/*`,
              `arn:aws:s3:::${this.bucketName}/avatars/*`,
            ],
          },
        ],
      };

      await this.s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucketName,
          Policy: JSON.stringify(policy),
        }),
      );

      // 3. Configure CORS for browsers loading SVGs/images cross-origin
      await this.s3Client.send(
        new PutBucketCorsCommand({
          Bucket: this.bucketName,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'HEAD'],
                AllowedOrigins: ['*'],
                ExposeHeaders: ['ETag'],
                MaxAgeSeconds: 86400,
              },
            ],
          },
        }),
      );

      this.logger.log(
        `S3 public media policy and CORS verified for bucket "${this.bucketName}".`,
      );
    } catch (err: any) {
      this.logger.warn(
        `Could not auto-verify S3 bucket policy/CORS: ${err?.message || err}`,
      );
    }
  }

  /**
   * Uploads a buffer to your S3 bucket
   */
  async uploadFileBuffer(
    key: string,
    fileBuffer: Buffer,
    mimeType: string,
    options?: UploadOptions,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      CacheControl: options?.cacheControl,
    });

    await this.s3Client.send(command);

    // Return key
    return key;
  }

  /**
   * Returns standard S3 public / object URL.
   *
   * Only valid for objects the bucket policy exposes publicly. Anything
   * sensitive must be served through `getPresignedUrl` instead.
   */
  getFileUrl(key: string): string {
    const region = this.configService.get('AWS_REGION', { infer: true });
    return `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;
  }

  /**
   * Returns a time-limited signed URL for a private object.
   *
   * @param expiresIn Lifetime in seconds (S3 caps SigV4 at 7 days).
   */
  async getPresignedUrl(key: string, expiresIn = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<boolean> {
    if (!key) return false;

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);

    return true;
  }
}
