import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/config/env.config';

export interface UploadOptions {
  cacheControl?: string;
}

export interface TenantStorageConfig {
  awsRegion?: string | null;
  awsAccessKeyId?: string | null;
  awsSecretAccessKey?: string | null;
  bucketName?: string | null;
}

/** Lifetime of signed URLs for private objects, in seconds. */
export const DOCUMENT_URL_TTL_SECONDS = 900;

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client!: S3Client;
  private bucketName!: string;
  private readonly tenantClients = new Map<
    string,
    { client: S3Client; bucket: string }
  >();

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
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
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
   * Returns standard public media URL routed through the high-performance media gateway.
   */
  getFileUrl(key: string): string {
    const rawKey = key.replace(/^\/+/, '');
    const baseUrl =
      this.configService.get('API_BASE_URL', { infer: true }) ||
      'https://api.royalmotionit.com';
    const cleanBase = baseUrl.replace(/\/+$/, '');
    return `${cleanBase}/media/public/${rawKey}`;
  }

  /**
   * Normalizes any raw direct S3 URLs to the public media gateway URL.
   */
  normalizeMediaUrl(url?: string | null): string | null {
    if (!url) return null;
    if (url.includes('.amazonaws.com/')) {
      const parts = url.split('.amazonaws.com/');
      if (parts[1]) {
        return this.getFileUrl(parts[1]);
      }
    }
    return url;
  }

  /**
   * Retrieves an object stream and metadata from S3.
   * If tenantId and config are provided, attempts reading from tenant's BYOC bucket first,
   * falling back to the central storage bucket if not found.
   */
  async getObjectStream(
    key: string,
    tenantId?: string,
    config?: TenantStorageConfig,
  ): Promise<{
    stream: any;
    contentType: string;
    contentLength?: number;
    etag?: string;
  }> {
    const rawKey = key.replace(/^\/+/, '');

    // 1. If tenant config is provided, attempt reading from tenant's bucket first
    if (tenantId && config?.bucketName && config?.awsAccessKeyId) {
      try {
        const { client, bucket } = this.getTenantS3Context(tenantId, config);
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: rawKey,
        });
        const res = await client.send(command);
        if (res.Body) {
          return {
            stream: res.Body,
            contentType: res.ContentType || 'application/octet-stream',
            contentLength: res.ContentLength,
            etag: res.ETag,
          };
        }
      } catch (err: any) {
        this.logger.debug(
          `Tenant bucket lookup failed for ${rawKey}, falling back to central bucket: ${err?.message || err}`,
        );
      }
    }

    // 2. Central Mother Company bucket
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: rawKey,
    });
    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error(`Object body for key ${rawKey} is empty`);
    }

    return {
      stream: response.Body,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength,
      etag: response.ETag,
    };
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
   * Generates a presigned PUT URL for direct client-side uploads (lossless audio, artwork, reports).
   */
  async getPresignedUploadUrl(
    key: string,
    mimeType: string,
    expiresIn = 900,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
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

  /**
   * Retrieves file buffer or partial byte range from S3.
   */
  async getFileBuffer(key: string, maxBytes?: number): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ...(maxBytes ? { Range: `bytes=0-${maxBytes - 1}` } : {}),
    });

    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error(`Object body for key ${key} is empty`);
    }

    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  /**
   * Resolves an S3 client and bucket name scoped to a specific WhiteLabel tenant's BYOC storage.
   * Falls back to Mother Company central storage if tenant storage is unconfigured.
   */
  getTenantS3Context(
    tenantId: string,
    config?: TenantStorageConfig,
  ): { client: S3Client; bucket: string } {
    if (
      config?.awsAccessKeyId &&
      config?.awsSecretAccessKey &&
      config?.bucketName
    ) {
      const cacheKey = `${tenantId}:${config.bucketName}`;
      const existing = this.tenantClients.get(cacheKey);
      if (existing) {
        return existing;
      }

      const client = new S3Client({
        region: config.awsRegion || 'ap-southeast-1',
        credentials: {
          accessKeyId: config.awsAccessKeyId,
          secretAccessKey: config.awsSecretAccessKey,
        },
      });

      const entry = { client, bucket: config.bucketName };
      this.tenantClients.set(cacheKey, entry);
      return entry;
    }

    return { client: this.s3Client, bucket: this.bucketName };
  }

  /**
   * Generates a presigned PUT upload URL scoped to the tenant's dedicated S3 bucket.
   */
  async getTenantPresignedUploadUrl(
    tenantId: string,
    key: string,
    mimeType: string,
    expiresIn = 900,
    config?: TenantStorageConfig,
  ): Promise<string> {
    const { client, bucket } = this.getTenantS3Context(tenantId, config);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mimeType,
    });
    return getSignedUrl(client, command, { expiresIn });
  }

  /**
   * Generates a time-limited signed GET URL for an object in the tenant's dedicated S3 bucket.
   */
  async getTenantPresignedUrl(
    tenantId: string,
    key: string,
    expiresIn = 900,
    config?: TenantStorageConfig,
  ): Promise<string> {
    const { client, bucket } = this.getTenantS3Context(tenantId, config);
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return getSignedUrl(client, command, { expiresIn });
  }

  /**
   * Retrieves file buffer or byte-range from the tenant's dedicated S3 bucket.
   */
  async getTenantFileBuffer(
    tenantId: string,
    key: string,
    maxBytes?: number,
    config?: TenantStorageConfig,
  ): Promise<Buffer> {
    const { client, bucket } = this.getTenantS3Context(tenantId, config);
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ...(maxBytes ? { Range: `bytes=0-${maxBytes - 1}` } : {}),
    });

    const response = await client.send(command);
    if (!response.Body) {
      throw new Error(
        `Object body for key ${key} in bucket ${bucket} is empty`,
      );
    }

    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  /**
   * Deletes a file from the tenant's dedicated S3 bucket.
   */
  async deleteTenantFile(
    tenantId: string,
    key: string,
    config?: TenantStorageConfig,
  ): Promise<boolean> {
    if (!key) return false;
    const { client, bucket } = this.getTenantS3Context(tenantId, config);
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await client.send(command);
    return true;
  }
}
