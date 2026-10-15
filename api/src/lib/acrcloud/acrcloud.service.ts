import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AudioScanStatus, Prisma } from 'src/generated/prisma/client';

export interface AcrCloudMatchMetadata {
  title?: string;
  artists?: { name: string }[];
  album?: { name: string };
  label?: string;
  score?: number;
  release_date?: string;
  external_ids?: {
    isrc?: string;
    upc?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface AcrCloudIdentifyResult {
  statusCode: number;
  statusMsg: string;
  isClean: boolean;
  hasMatch: boolean;
  bestMatch?: {
    title?: string;
    artist?: string;
    album?: string;
    isrc?: string;
    label?: string;
    score?: number;
    externalIds?: Record<string, unknown>;
    raw?: unknown;
  };
  rawResponse?: unknown;
  error?: string;
}

@Injectable()
export class AcrCloudService {
  private readonly logger = new Logger(AcrCloudService.name);
  private readonly host?: string;
  private readonly accessKey?: string;
  private readonly accessSecret?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {
    this.host = this.configService.get<string>('ACRCLOUD_HOST');
    this.accessKey = this.configService.get<string>('ACRCLOUD_ACCESS_KEY');
    this.accessSecret = this.configService.get<string>('ACRCLOUD_ACCESS_SECRET');
  }

  /**
   * Generates HMAC-SHA1 signature required by ACRCloud Identification API v1.
   */
  generateSignature(
    httpMethod: string,
    httpUri: string,
    accessKey: string,
    dataType: string,
    signatureVersion: string,
    timestamp: string,
    accessSecret: string,
  ): string {
    const stringToSign = [
      httpMethod,
      httpUri,
      accessKey,
      dataType,
      signatureVersion,
      timestamp,
    ].join('\n');

    return crypto
      .createHmac('sha1', accessSecret)
      .update(Buffer.from(stringToSign, 'utf-8'))
      .digest('base64');
  }

  /**
   * Checks whether ACRCloud credentials are fully configured.
   */
  isConfigured(): boolean {
    return Boolean(this.host && this.accessKey && this.accessSecret);
  }

  /**
   * Identifies an audio sample buffer using ACRCloud API.
   * If credentials are not configured, gracefully returns a clean result
   * with diagnostic notice to avoid crashing local environments.
   */
  async identifyAudio(sampleBuffer: Buffer): Promise<AcrCloudIdentifyResult> {
    if (!this.isConfigured()) {
      this.logger.warn(
        'ACRCloud credentials not configured in environment. Defaulting scan to CLEAN.',
      );
      return {
        statusCode: 1001,
        statusMsg: 'ACRCloud credentials not configured in environment',
        isClean: true,
        hasMatch: false,
      };
    }

    const host = this.host!.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const url = `https://${host}/v1/identify`;
    const httpMethod = 'POST';
    const httpUri = '/v1/identify';
    const dataType = 'audio';
    const signatureVersion = '1';
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = this.generateSignature(
      httpMethod,
      httpUri,
      this.accessKey!,
      dataType,
      signatureVersion,
      timestamp,
      this.accessSecret!,
    );

    const formData = new FormData();
    formData.append(
      'sample',
      new Blob([new Uint8Array(sampleBuffer)]),
      'sample.mp3',
    );
    formData.append('access_key', this.accessKey!);
    formData.append('data_type', dataType);
    formData.append('signature_version', signatureVersion);
    formData.append('signature', signature);
    formData.append('sample_bytes', sampleBuffer.length.toString());
    formData.append('timestamp', timestamp);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const text = await response.text();
        return {
          statusCode: response.status,
          statusMsg: `HTTP ${response.status}`,
          isClean: false,
          hasMatch: false,
          error: `ACRCloud responded with HTTP ${response.status}: ${text.slice(0, 200)}`,
        };
      }

      const json = await response.json();
      const code = json.status?.code;
      const msg = json.status?.msg || 'OK';

      // 0: Success with match
      if (code === 0) {
        const musicList: AcrCloudMatchMetadata[] = json.metadata?.music || [];
        if (musicList.length > 0) {
          const match = musicList[0];
          const artistName = match.artists?.map((a) => a.name).join(', ') || null;

          return {
            statusCode: 0,
            statusMsg: msg,
            isClean: false,
            hasMatch: true,
            bestMatch: {
              title: match.title,
              artist: artistName || undefined,
              album: match.album?.name,
              isrc: match.external_ids?.isrc,
              label: match.label,
              score: match.score,
              externalIds: match.external_ids as Record<string, unknown>,
              raw: match,
            },
            rawResponse: json,
          };
        }

        // Return clean if code 0 but no music items
        return {
          statusCode: 0,
          statusMsg: msg,
          isClean: true,
          hasMatch: false,
          rawResponse: json,
        };
      }

      // 1001: No match found (Clean audio)
      if (code === 1001) {
        return {
          statusCode: 1001,
          statusMsg: 'No match found',
          isClean: true,
          hasMatch: false,
          rawResponse: json,
        };
      }

      // Any other code represents an identification error (e.g., bad signature, rate limit)
      return {
        statusCode: code ?? 500,
        statusMsg: msg,
        isClean: false,
        hasMatch: false,
        error: `ACRCloud Error (${code}): ${msg}`,
        rawResponse: json,
      };
    } catch (err: any) {
      this.logger.error(`Failed to identify audio via ACRCloud: ${err.message}`);
      return {
        statusCode: 500,
        statusMsg: 'Network Error',
        isClean: false,
        hasMatch: false,
        error: err.message,
      };
    }
  }

  /**
   * Scans a specific track by its database ID, updating its TrackAudioScan record.
   */
  async scanTrack(trackId: string) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      include: {
        audioScan: true,
        release: {
          include: {
            whiteLabel: true,
          },
        },
      },
    });

    if (!track) {
      throw new NotFoundException(`Track with id ${trackId} not found`);
    }

    if (!track.audioKey) {
      this.logger.warn(`Track ${track.code} has no audioKey, skipping audio scan.`);
      return null;
    }

    // Ensure initial PENDING record exists
    let scan = track.audioScan;
    if (!scan) {
      scan = await this.prisma.trackAudioScan.create({
        data: {
          trackId: track.id,
          status: AudioScanStatus.PENDING,
        },
      });
    } else {
      scan = await this.prisma.trackAudioScan.update({
        where: { id: scan.id },
        data: {
          status: AudioScanStatus.PENDING,
          errorMessage: null,
        },
      });
    }

    try {
      // Pull first 2MB snippet (~15-30s) of lossless audio using S3 byte-range request
      let sampleBuffer: Buffer;
      const wl = track.release?.whiteLabel;
      if (
        wl &&
        wl.awsAccessKeyId &&
        wl.awsSecretAccessKey &&
        wl.bucketName
      ) {
        sampleBuffer = await this.storageService.getTenantFileBuffer(
          wl.id,
          track.audioKey,
          2 * 1024 * 1024,
          {
            bucketName: wl.bucketName,
            awsRegion: wl.awsRegion || 'ap-southeast-1',
            awsAccessKeyId: wl.awsAccessKeyId,
            awsSecretAccessKey: wl.awsSecretAccessKey,
          },
        );
      } else {
        sampleBuffer = await this.storageService.getFileBuffer(
          track.audioKey,
          2 * 1024 * 1024,
        );
      }

      const result = await this.identifyAudio(sampleBuffer);

      if (result.hasMatch && result.bestMatch) {
        return await this.prisma.trackAudioScan.update({
          where: { id: scan.id },
          data: {
            status: AudioScanStatus.MATCH_FOUND,
            matchScore: result.bestMatch.score ?? 100,
            matchedTitle: result.bestMatch.title ?? null,
            matchedArtist: result.bestMatch.artist ?? null,
            matchedAlbum: result.bestMatch.album ?? null,
            matchedIsrc: result.bestMatch.isrc ?? null,
            matchedLabel: result.bestMatch.label ?? null,
            externalIds:
              (result.bestMatch.externalIds as Prisma.InputJsonValue) ??
              Prisma.JsonNull,
            rawMetadata:
              (result.bestMatch.raw as Prisma.InputJsonValue) ??
              Prisma.JsonNull,
            errorMessage: null,
            scannedAt: new Date(),
          },
        });
      }

      if (result.isClean) {
        return await this.prisma.trackAudioScan.update({
          where: { id: scan.id },
          data: {
            status: AudioScanStatus.CLEAN,
            matchScore: null,
            matchedTitle: null,
            matchedArtist: null,
            matchedAlbum: null,
            matchedIsrc: null,
            matchedLabel: null,
            externalIds: Prisma.JsonNull,
            rawMetadata:
              (result.rawResponse as Prisma.InputJsonValue) ??
              Prisma.JsonNull,
            errorMessage: result.error ?? null,
            scannedAt: new Date(),
          },
        });
      }

      // Result failed
      return await this.prisma.trackAudioScan.update({
        where: { id: scan.id },
        data: {
          status: AudioScanStatus.FAILED,
          errorMessage: result.error || result.statusMsg || 'Scan failed',
          scannedAt: new Date(),
        },
      });
    } catch (err: any) {
      this.logger.error(`Error scanning track ${track.code}: ${err.message}`);
      return await this.prisma.trackAudioScan.update({
        where: { id: scan.id },
        data: {
          status: AudioScanStatus.FAILED,
          errorMessage: `Scan error: ${err.message}`,
          scannedAt: new Date(),
        },
      });
    }
  }

  /**
   * Scans a track by its unique track code.
   */
  async scanTrackByCode(trackCode: string) {
    const track = await this.prisma.track.findUnique({
      where: { code: trackCode },
    });

    if (!track) {
      throw new NotFoundException(`Track with code ${trackCode} not found`);
    }

    return this.scanTrack(track.id);
  }
}
