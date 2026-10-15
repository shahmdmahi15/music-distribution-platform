import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/config/env.config';

export interface R2UploadOptions {
  cacheControl?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export const R2_PRESIGNED_URL_TTL_SECONDS = 900;

@Injectable()
export class R2StorageService implements OnModuleInit {
  private readonly logger = new Logger(R2StorageService.name);
  private r2Client!: S3Client;
  private bucketName!: string;
  private publicBaseUrl?: string;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  onModuleInit() {
    const accountId =
      this.configService.get('CLOUDFLARE_ACCOUNT_ID', { infer: true }) ||
      process.env.CLOUDFLARE_ACCOUNT_ID;

    const accessKeyId =
      this.configService.get('CLOUDFLARE_R2_ACCESS_KEY_ID', { infer: true }) ||
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
      this.configService.get('AWS_ACCESS_KEY_ID', { infer: true });

    const secretAccessKey =
      this.configService.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY', {
        infer: true,
      }) ||
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
      this.configService.get('AWS_SECRET_ACCESS_KEY', { infer: true });

    this.bucketName =
      this.configService.get('CLOUDFLARE_R2_BUCKET', { infer: true }) ||
      process.env.CLOUDFLARE_R2_BUCKET ||
      this.configService.get('AWS_S3_BUCKET', { infer: true }) ||
      'music-distribution-media';

    this.publicBaseUrl =
      this.configService.get('CLOUDFLARE_R2_PUBLIC_URL', { infer: true }) ||
      process.env.CLOUDFLARE_R2_PUBLIC_URL;

    if (!accountId) {
      this.logger.warn(
        `[R2StorageService] CLOUDFLARE_ACCOUNT_ID not configured. S3 client fallback initialized.`,
      );
    }

    const endpoint = accountId
      ? `https://${accountId}.r2.cloudflarestorage.com`
      : undefined;

    this.r2Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: accessKeyId || 'unconfigured',
        secretAccessKey: secretAccessKey || 'unconfigured',
      },
    });

    this.logger.log(
      `[R2StorageService] Cloudflare R2 client initialized for bucket "${this.bucketName}" ($0.00 Egress Architecture).`,
    );
  }

  /**
   * Uploads a buffer directly to Cloudflare R2 bucket.
   * Drop-in compatible with StorageService.uploadFileBuffer
   */
  async uploadFileBuffer(
    key: string,
    fileBuffer: Buffer,
    mimeType: string,
    options?: R2UploadOptions,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: options?.contentType || mimeType,
      CacheControl: options?.cacheControl || 'public, max-age=31536000, immutable',
      Metadata: options?.metadata,
    });

    await this.r2Client.send(command);
    return key;
  }

  /**
   * Returns public URL or CDN-cached stream URL with $0.00 egress
   */
  getFileUrl(key: string): string {
    if (this.publicBaseUrl) {
      const cleanBase = this.publicBaseUrl.replace(/\/+$/, '');
      const cleanKey = key.replace(/^\/+/, '');
      return `${cleanBase}/${cleanKey}`;
    }
    return `https://${this.bucketName}.r2.cloudflarestorage.com/${key}`;
  }

  /**
   * Generates a signed URL for private R2 objects (e.g. contracts, master FLAC/WAV stems)
   */
  async getPresignedUrl(
    key: string,
    expiresIn = R2_PRESIGNED_URL_TTL_SECONDS,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.r2Client, command, { expiresIn });
  }

  /**
   * Generates a direct presigned upload PUT URL for client-side multi-gigabyte audio uploads
   */
  async getPresignedUploadUrl(
    key: string,
    mimeType: string,
    expiresIn = 1800,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
    });

    return getSignedUrl(this.r2Client, command, { expiresIn });
  }

  /**
   * Deletes a file from R2
   */
  async deleteFile(key: string): Promise<boolean> {
    if (!key) return false;

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.r2Client.send(command);
    return true;
  }

  /**
   * Checks file existence and retrieves metadata
   */
  async headFile(
    key: string,
  ): Promise<{ contentLength?: number; contentType?: string; eTag?: string } | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.r2Client.send(command);
      return {
        contentLength: response.ContentLength,
        contentType: response.ContentType,
        eTag: response.ETag,
      };
    } catch {
      return null;
    }
  }

  /**
   * Copies an object within the R2 bucket
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<boolean> {
    const command = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${encodeURIComponent(sourceKey)}`,
      Key: destinationKey,
    });

    await this.r2Client.send(command);
    return true;
  }
}
