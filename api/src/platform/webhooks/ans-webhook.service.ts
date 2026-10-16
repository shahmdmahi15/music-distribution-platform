import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { RedisService } from 'src/lib/redis/redis.service';
import { ReleaseStatus, UpstreamStatus } from 'src/generated/prisma/client';

export interface WebhookPayloadInput {
  signatureHeader?: string;
  timestampHeader?: string;
  rawBody: string;
}

@Injectable()
export class AnsWebhookService {
  private readonly logger = new Logger(AnsWebhookService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private getWebhookSecret(): string {
    const secret = this.configService.get<string>('ANS_WEBHOOK_SECRET');
    if (!secret) {
      throw new InternalServerErrorException(
        'ANS_WEBHOOK_SECRET is not configured on the central API',
      );
    }
    return secret;
  }

  verifySignature(rawBody: string, signatureHeader?: string, timestampHeader?: string): {
    timestamp: number;
    signature: string;
  } {
    if (!signatureHeader) {
      throw new UnauthorizedException('Missing webhook signature header');
    }

    let timestamp: number;
    let signatureHex = '';

    // Check if format is "t=<timestamp>,v1=<sig>" or separate headers
    if (signatureHeader.includes('t=') && signatureHeader.includes('v1=')) {
      const parts = signatureHeader.split(',');
      const tPart = parts.find((p) => p.trim().startsWith('t='));
      const v1Part = parts.find((p) => p.trim().startsWith('v1='));

      if (!tPart || !v1Part) {
        throw new UnauthorizedException('Malformed webhook signature header');
      }

      timestamp = parseInt(tPart.split('=')[1], 10);
      signatureHex = v1Part.split('=')[1];
    } else {
      timestamp = timestampHeader ? parseInt(timestampHeader, 10) : 0;
      signatureHex = signatureHeader.startsWith('v1=')
        ? signatureHeader.slice(3)
        : signatureHeader;
    }

    if (!timestamp || isNaN(timestamp)) {
      throw new UnauthorizedException('Invalid or missing webhook timestamp');
    }

    // Check timestamp tolerance (+/- 300 seconds)
    const nowSec = Math.floor(Date.now() / 1000);
    const drift = Math.abs(nowSec - timestamp);
    if (drift > 300) {
      this.logger.warn(`Webhook timestamp drift exceeded: ${drift}s (limit: 300s)`);
      throw new UnauthorizedException('Webhook timestamp outside allowed tolerance');
    }

    const secret = this.getWebhookSecret();
    const payloadToSign = `${timestamp}.${rawBody}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadToSign)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSig, 'utf8');
    const actualBuffer = Buffer.from(signatureHex, 'utf8');

    if (
      expectedBuffer.length !== actualBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
    ) {
      this.logger.warn('Webhook signature mismatch detected');
      throw new UnauthorizedException('Invalid webhook cryptographic signature');
    }

    return { timestamp, signature: signatureHex };
  }

  async handleWebhook(input: WebhookPayloadInput): Promise<{ received: boolean; deduplicated?: boolean }> {
    const { signatureHeader, timestampHeader, rawBody } = input;

    // Verify cryptographic signature and timestamp
    this.verifySignature(rawBody, signatureHeader, timestampHeader);

    let parsedEvent: any;
    try {
      parsedEvent = JSON.parse(rawBody);
    } catch {
      throw new UnauthorizedException('Invalid JSON payload');
    }

    const eventId = parsedEvent.id || parsedEvent.eventId || `evt_${Date.now()}`;
    const eventType = parsedEvent.type || parsedEvent.eventType || '';
    const eventData = parsedEvent.data || {};

    // Redis deduplication check
    const dedupKey = `ans:webhook:event:${eventId}`;
    const existing = await this.redis.get(dedupKey);
    if (existing) {
      this.logger.log(`Webhook event ${eventId} already processed (deduplicated)`);
      return { received: true, deduplicated: true };
    }

    // Save event in Redis with 24 hour TTL
    await this.redis.set(dedupKey, 'PROCESSED', 86400);

    // Save in UpstreamWebhookLog
    try {
      await this.prisma.upstreamWebhookLog.create({
        data: {
          eventId,
          eventType,
          environment: parsedEvent.environment || 'live',
          payload: parsedEvent,
          status: 'PROCESSED',
        },
      });
    } catch (e: any) {
      this.logger.warn(`Failed to log webhook event ${eventId}: ${e.message}`);
    }

    // Process event lifecycle
    switch (eventType) {
      case 'release.approved':
        await this.handleReleaseApproved(eventData);
        break;
      case 'release.needs_fix':
        await this.handleReleaseNeedsFix(eventData);
        break;
      case 'release.delivered':
        await this.handleReleaseDelivered(eventData);
        break;
      case 'release.youtube_linked':
        await this.handleReleaseYoutubeLinked(eventData);
        break;
      case 'release.rejected':
        await this.handleReleaseRejected(eventData);
        break;
      case 'channel.approved':
        await this.handleChannelApproved(eventData);
        break;
      case 'channel.rejected':
        await this.handleChannelRejected(eventData);
        break;
      default:
        this.logger.log(`Unhandled webhook event type: ${eventType}`);
        break;
    }

    return { received: true };
  }

  private async handleReleaseApproved(data: any) {
    const releaseCode = data.releaseCode || data.externalId;
    const upc = data.upc;
    const tracks = data.tracks || [];

    if (!releaseCode) return;

    this.logger.log(`Processing release.approved for ${releaseCode} (UPC: ${upc})`);

    await this.prisma.release.update({
      where: { code: releaseCode },
      data: {
        status: ReleaseStatus.APPROVED,
        upstreamStatus: UpstreamStatus.APPROVED,
        isLocked: true,
        ...(upc ? { upc, upcAssignedByUpstream: true } : {}),
      },
    });

    for (const t of tracks) {
      const trackCode = t.trackCode || t.externalId;
      const isrc = t.isrc;
      if (trackCode && isrc) {
        await this.prisma.track.update({
          where: { code: trackCode },
          data: { isrc },
        });
      }
    }
  }

  private async handleReleaseNeedsFix(data: any) {
    const releaseCode = data.releaseCode || data.externalId;
    const upstreamReason =
      data.upstreamReason || data.reason || 'Upstream quality review requested corrections';

    if (!releaseCode) return;

    this.logger.warn(
      `Processing release.needs_fix for ${releaseCode}: ${upstreamReason}`,
    );

    await this.prisma.release.update({
      where: { code: releaseCode },
      data: {
        status: ReleaseStatus.REJECTED,
        upstreamStatus: UpstreamStatus.NEEDS_FIX,
        isLocked: false,
        rejectionReason: upstreamReason,
        upstreamReason,
        adminNotes: `ANS Music Reviewer: ${upstreamReason}`,
      },
    });
  }

  private async handleReleaseDelivered(data: any) {
    const releaseCode = data.releaseCode || data.externalId;
    if (!releaseCode) return;

    await this.prisma.release.update({
      where: { code: releaseCode },
      data: {
        status: ReleaseStatus.DISTRIBUTED,
        upstreamStatus: UpstreamStatus.DELIVERED,
      },
    });
  }

  private async handleReleaseYoutubeLinked(data: any) {
    const releaseCode = data.releaseCode || data.externalId;
    const trackCode = data.trackCode;
    const youtubeVideoId = data.youtubeVideoId || data.videoId;
    const watchUrl = data.watchUrl || data.videoUrl;

    if (!releaseCode && !trackCode) return;

    this.logger.log(
      `Processing release.youtube_linked: ${releaseCode || trackCode} -> ${youtubeVideoId} (${watchUrl})`,
    );

    if (releaseCode) {
      await this.prisma.release.update({
        where: { code: releaseCode },
        data: {
          youtubeVideoId,
          youtubeWatchUrl: watchUrl,
        },
      });
    }

    if (trackCode) {
      await this.prisma.track.update({
        where: { code: trackCode },
        data: {
          audioUrl: watchUrl || undefined,
        },
      });
    }
  }

  private async handleReleaseRejected(data: any) {
    const releaseCode = data.releaseCode || data.externalId;
    const reason = data.reason || data.upstreamReason || 'Release rejected by DSP upstream';
    if (!releaseCode) return;

    await this.prisma.release.update({
      where: { code: releaseCode },
      data: {
        status: ReleaseStatus.REJECTED,
        upstreamStatus: UpstreamStatus.REJECTED,
        isLocked: false,
        rejectionReason: reason,
        upstreamReason: reason,
      },
    });
  }

  private async handleChannelApproved(data: any) {
    const channelCode = data.channelCode || data.externalId;
    const channelUrl = data.channelUrl;
    const youtubeChannelId = data.youtubeChannelId;

    if (!channelCode) return;

    this.logger.log(
      `Processing channel.approved: ${channelCode} -> ${channelUrl} (${youtubeChannelId})`,
    );

    await this.prisma.vevoChannel.update({
      where: { code: channelCode },
      data: {
        status: 'APPROVED',
        channelUrl,
        youtubeChannelId,
      },
    });
  }

  private async handleChannelRejected(data: any) {
    const channelCode = data.channelCode || data.externalId;
    if (!channelCode) return;

    await this.prisma.vevoChannel.update({
      where: { code: channelCode },
      data: {
        status: 'REJECTED',
      },
    });
  }
}
