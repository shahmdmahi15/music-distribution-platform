import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/config/env.config';

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
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);

    // Return key
    return key;
  }

  /**
   * Retrieves a file's buffer from S3
   */
  async getFileBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    if (!response.Body) {
      throw new Error(`S3 GetObject returned empty body for key: ${key}`);
    }

    const byteArray = await response.Body.transformToByteArray();

    return Buffer.from(byteArray);
  }

  /**
   * Retrieves a image's base64 data URL from S3
   */
  async getImageBase64(key: string): Promise<string> {
    const fileBuffer = await this.getFileBuffer(key);

    let mimeType = 'image/png';

    if (
      fileBuffer.length >= 4 &&
      fileBuffer[0] === 0x89 &&
      fileBuffer[1] === 0x50 &&
      fileBuffer[2] === 0x4e &&
      fileBuffer[3] === 0x47
    ) {
      mimeType = 'image/png';
    } else if (
      fileBuffer.length >= 2 &&
      fileBuffer[0] === 0xff &&
      fileBuffer[1] === 0xd8
    ) {
      mimeType = 'image/jpeg';
    } else if (
      fileBuffer.length >= 12 &&
      fileBuffer.toString('ascii', 0, 4) === 'RIFF' &&
      fileBuffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      mimeType = 'image/webp';
    } else if (key.endsWith('.jpg') || key.endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (key.endsWith('.webp')) {
      mimeType = 'image/webp';
    }

    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  }
}
