import {
  Controller,
  Get,
  Head,
  Options,
  Req,
  Res,
  Query,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { StorageService } from './storage.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Options('public/*')
  @SkipThrottle()
  optionsPublicWildcard(@Res() res: Response) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.status(204).end();
  }

  @Head('public/*')
  @SkipThrottle()
  async headPublicMediaWildcard(@Req() req: Request, @Res() res: Response) {
    const rawKey =
      (req.params as any)?.[0] ||
      (req.params as any)?.['0'] ||
      (req.params as any)?.key ||
      (req.path || '').replace(/^\/?media\/public\/?/, '') ||
      '';
    return this.streamPublicMedia(rawKey, req, res, true);
  }

  @Get('public/*')
  @SkipThrottle()
  async getPublicMediaWildcard(@Req() req: Request, @Res() res: Response) {
    const rawKey =
      (req.params as any)?.[0] ||
      (req.params as any)?.['0'] ||
      (req.params as any)?.key ||
      (req.path || '').replace(/^\/?media\/public\/?/, '') ||
      '';
    return this.streamPublicMedia(rawKey, req, res, false);
  }

  @Options('public')
  @SkipThrottle()
  optionsPublic(@Res() res: Response) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.status(204).end();
  }

  @Head('public')
  @SkipThrottle()
  async headPublicMedia(
    @Query('key') queryKey: string,
    @Query('url') queryUrl: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.handleMediaRequest(queryKey, queryUrl, req, res, true);
  }

  @Get('public')
  @SkipThrottle()
  async getPublicMedia(
    @Query('key') queryKey: string,
    @Query('url') queryUrl: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.handleMediaRequest(queryKey, queryUrl, req, res, false);
  }

  private async handleMediaRequest(
    queryKey: string,
    queryUrl: string,
    req: Request,
    res: Response,
    isHead: boolean,
  ) {
    let key = queryKey;
    if (!key && queryUrl) {
      const s3Match = queryUrl.match(/amazonaws\.com\/(.+)$/);
      if (s3Match) {
        key = s3Match[1];
      } else {
        const mediaMatch = queryUrl.match(/\/media\/public\/(.+)$/);
        if (mediaMatch) {
          key = mediaMatch[1];
        } else {
          key = queryUrl;
        }
      }
    }
    return this.streamPublicMedia(key, req, res, isHead);
  }

  private async streamPublicMedia(
    rawKey: string,
    req: Request,
    res: Response,
    isHead: boolean,
  ) {
    if (!rawKey) {
      throw new BadRequestException('Media key is required.');
    }

    // Clean leading slashes and decoded characters
    let key = decodeURIComponent(rawKey).replace(/^\/+/, '');
    if (key.includes('?')) {
      key = key.split('?')[0];
    }

    // Security check: Only allow public media assets (branding, covers, avatars, public)
    const isPublic =
      key.includes('/branding/') ||
      key.startsWith('branding/') ||
      key.includes('/covers/') ||
      key.startsWith('covers/') ||
      key.includes('/avatars/') ||
      key.startsWith('avatars/') ||
      key.startsWith('public/');

    if (!isPublic) {
      throw new ForbiddenException(
        'Access to private assets via public media gateway is prohibited.',
      );
    }

    // Check if key is scoped to a WhiteLabel tenant with custom BYOC bucket
    let tenantId: string | undefined;
    let tenantConfig:
      | {
          awsRegion?: string | null;
          awsAccessKeyId?: string | null;
          awsSecretAccessKey?: string | null;
          bucketName?: string | null;
        }
      | undefined;

    if (key.startsWith('whitelabels/')) {
      const parts = key.split('/');
      tenantId = parts[1];
      if (tenantId) {
        try {
          const wl = await this.prisma.whiteLabel.findUnique({
            where: { id: tenantId },
            select: {
              awsRegion: true,
              awsAccessKeyId: true,
              awsSecretAccessKey: true,
              bucketName: true,
            },
          });
          if (wl?.bucketName && wl.awsAccessKeyId && wl.awsSecretAccessKey) {
            tenantConfig = wl;
          }
        } catch (dbErr: any) {
          this.logger.debug(
            `Could not resolve tenant storage config for ${tenantId}: ${dbErr?.message || dbErr}`,
          );
        }
      }
    }

    try {
      const media = await this.storageService.getObjectStream(
        key,
        tenantId,
        tenantConfig,
      );

      // Handle conditional ETag for 304 Not Modified
      if (media.etag && req.headers['if-none-match'] === media.etag) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.status(304).end();
        return;
      }

      res.setHeader('Content-Type', media.contentType);
      if (media.contentLength !== undefined && media.contentLength !== null) {
        res.setHeader('Content-Length', media.contentLength.toString());
      }
      if (media.etag) {
        res.setHeader('ETag', media.etag);
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      if (isHead) {
        res.status(200).end();
        return;
      }

      // Pipe the stream to response
      if (typeof (media.stream as any)?.pipe === 'function') {
        (media.stream as any).pipe(res);
      } else if (typeof (media.stream as any)?.transformToByteArray === 'function') {
        const buffer = await (media.stream as any).transformToByteArray();
        res.end(Buffer.from(buffer));
      } else {
        res.end(media.stream);
      }
    } catch (err: any) {
      if (
        err.name === 'NoSuchKey' ||
        err.$metadata?.httpStatusCode === 404 ||
        err.code === 'ENOENT'
      ) {
        throw new NotFoundException(`Media asset not found: ${key}`);
      }
      this.logger.error(`Failed to stream media key ${key}: ${err.message}`);
      throw new InternalServerErrorException('Failed to retrieve media asset.');
    }
  }
}
