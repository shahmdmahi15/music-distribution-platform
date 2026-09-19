import { Injectable, OnModuleInit } from '@nestjs/common';
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

/** Lifetime of signed URLs for private objects, in seconds. */
export const DOCUMENT_URL_TTL_SECONDS = 900;

@Injectable()
export class StorageService implements OnModuleInit {
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
