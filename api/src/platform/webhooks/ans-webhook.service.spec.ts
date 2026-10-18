import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AnsWebhookService } from './ans-webhook.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { RedisService } from 'src/lib/redis/redis.service';
import { ReleaseStatus, UpstreamStatus } from 'src/generated/prisma/client';

describe('AnsWebhookService', () => {
  let service: AnsWebhookService;
  let prisma: PrismaService;
  let redis: RedisService;

  const webhookSecret =
    'test_ans_secret_key_64_characters_long_for_hmac_sha256_verification';

  // Helper to construct exact HMAC-SHA256 signatures matching the implementation contract:
  // Signature = HMAC-SHA256(secret, `${timestamp}.${rawBody}`)
  const generateValidSignature = (
    body: string,
    timestamp: number,
    secret: string = webhookSecret,
  ): string => {
    const payloadToSign = `${timestamp}.${body}`;
    return crypto
      .createHmac('sha256', secret)
      .update(payloadToSign)
      .digest('hex');
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnsWebhookService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'ANS_WEBHOOK_SECRET') return webhookSecret;
              return defaultValue;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            release: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            track: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            vevoChannel: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            upstreamWebhookLog: {
              create: jest.fn().mockResolvedValue({ id: 'log_1' }),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnsWebhookService>(AnsWebhookService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cryptographic HMAC-SHA256 Signature Verification', () => {
    it('should verify signature and process webhook when signature and timestamp are valid', async () => {
      const now = Math.floor(Date.now() / 1000);
      const rawPayload = JSON.stringify({
        id: 'evt_sig_test_01',
        type: 'test.ping',
        timestamp: now,
        data: {},
      });
      const validSig = generateValidSignature(rawPayload, now);

      (redis.get as jest.Mock).mockResolvedValueOnce(null);
      (redis.set as jest.Mock).mockResolvedValueOnce('OK');

      const result = await service.handleWebhook({
        signatureHeader: `t=${now},v1=${validSig}`,
        rawBody: rawPayload,
      });

      expect(result).toEqual({ received: true });
    });

    it('should throw UnauthorizedException when body has been tampered with', async () => {
      const now = Math.floor(Date.now() / 1000);
      const authenticBody = JSON.stringify({
        id: 'evt_tamper_01',
        type: 'release.approved',
        timestamp: now,
        data: { upc: '793573179001' },
      });
      const signature = generateValidSignature(authenticBody, now);

      const tamperedBody = JSON.stringify({
        id: 'evt_tamper_01',
        type: 'release.approved',
        timestamp: now,
        data: { upc: '793573179999' },
      });

      await expect(
        service.handleWebhook({
          signatureHeader: `t=${now},v1=${signature}`,
          rawBody: tamperedBody,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when signature header contains invalid signature', async () => {
      const now = Math.floor(Date.now() / 1000);
      const rawBody = JSON.stringify({ id: 'evt_forged_01' });

      await expect(
        service.handleWebhook({
          signatureHeader: `t=${now},v1=completely_fake_and_invalid_signature_hex`,
          rawBody,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when timestamp is stale (> 300 seconds old)', async () => {
      const staleTimestamp = Math.floor(Date.now() / 1000) - 305;
      const rawBody = JSON.stringify({ id: 'evt_replay_01' });
      const signature = generateValidSignature(rawBody, staleTimestamp);

      await expect(
        service.handleWebhook({
          signatureHeader: `t=${staleTimestamp},v1=${signature}`,
          rawBody,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when timestamp is drifted too far in the future (> 300s)', async () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 310;
      const rawBody = JSON.stringify({ id: 'evt_future_01' });
      const signature = generateValidSignature(rawBody, futureTimestamp);

      await expect(
        service.handleWebhook({
          signatureHeader: `t=${futureTimestamp},v1=${signature}`,
          rawBody,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Redis Event Deduplication', () => {
    it('should acknowledge duplicate event with HTTP 200 without reprocessing or mutating DB', async () => {
      const now = Math.floor(Date.now() / 1000);
      const eventId = 'evt_duplicate_id_999';
      const rawPayload = JSON.stringify({
        id: eventId,
        type: 'release.approved',
        timestamp: now,
        data: {
          releaseCode: 'REL-2026-001',
          upc: '793573179012',
        },
      });
      const validSig = generateValidSignature(rawPayload, now);

      (redis.get as jest.Mock).mockResolvedValueOnce('PROCESSED');

      const response = await service.handleWebhook({
        signatureHeader: `t=${now},v1=${validSig}`,
        rawBody: rawPayload,
      });

      expect(response).toEqual({ received: true, deduplicated: true });
      expect(redis.get).toHaveBeenCalledWith(`ans:webhook:event:${eventId}`);
      expect(prisma.release.update).not.toHaveBeenCalled();
      expect(prisma.track.update).not.toHaveBeenCalled();
    });
  });

  describe('Event Lifecycle: release.approved', () => {
    it('should update release status to APPROVED and save assigned UPC and track ISRCs', async () => {
      const now = Math.floor(Date.now() / 1000);
      const event = {
        id: 'evt_appr_01',
        type: 'release.approved',
        timestamp: now,
        data: {
          releaseCode: 'REL-ROYAL-100',
          upc: '793573179012',
          tracks: [
            { trackCode: 'TRK-001', isrc: 'USRM12600001' },
            { trackCode: 'TRK-002', isrc: 'USRM12600002' },
          ],
        },
      };

      const rawPayload = JSON.stringify(event);
      const signature = generateValidSignature(rawPayload, now);

      (redis.get as jest.Mock).mockResolvedValueOnce(null);
      (redis.set as jest.Mock).mockResolvedValueOnce('OK');
      (prisma.release.update as jest.Mock).mockResolvedValueOnce({
        id: 'rel_id_100',
        code: 'REL-ROYAL-100',
        status: ReleaseStatus.APPROVED,
        upc: '793573179012',
      });

      await service.handleWebhook({
        signatureHeader: `t=${now},v1=${signature}`,
        rawBody: rawPayload,
      });

      expect(prisma.release.update).toHaveBeenCalledWith({
        where: { code: 'REL-ROYAL-100' },
        data: {
          status: ReleaseStatus.APPROVED,
          upstreamStatus: UpstreamStatus.APPROVED,
          upc: '793573179012',
          upcAssignedByUpstream: true,
          isLocked: true,
        },
      });

      expect(prisma.track.update).toHaveBeenCalledTimes(2);
      expect(prisma.track.update).toHaveBeenCalledWith({
        where: { code: 'TRK-001' },
        data: { isrc: 'USRM12600001' },
      });
      expect(prisma.track.update).toHaveBeenCalledWith({
        where: { code: 'TRK-002' },
        data: { isrc: 'USRM12600002' },
      });
    });
  });

  describe('Event Lifecycle: release.needs_fix', () => {
    it('should unlock release, set status to REJECTED / NEEDS_FIX, and save upstreamReason', async () => {
      const now = Math.floor(Date.now() / 1000);
      const upstreamReason =
        'Cover art resolution 1400x1400 does not meet minimum 3000x3000px requirement';
      const event = {
        id: 'evt_fix_02',
        type: 'release.needs_fix',
        timestamp: now,
        data: {
          releaseCode: 'REL-ROYAL-101',
          upstreamReason,
        },
      };

      const rawPayload = JSON.stringify(event);
      const signature = generateValidSignature(rawPayload, now);

      (redis.get as jest.Mock).mockResolvedValueOnce(null);
      (redis.set as jest.Mock).mockResolvedValueOnce('OK');
      (prisma.release.update as jest.Mock).mockResolvedValueOnce({
        id: 'rel_id_101',
        code: 'REL-ROYAL-101',
        status: ReleaseStatus.REJECTED,
        isLocked: false,
      });

      await service.handleWebhook({
        signatureHeader: `t=${now},v1=${signature}`,
        rawBody: rawPayload,
      });

      expect(prisma.release.update).toHaveBeenCalledWith({
        where: { code: 'REL-ROYAL-101' },
        data: {
          status: ReleaseStatus.NEEDS_FIX,
          upstreamStatus: UpstreamStatus.NEEDS_FIX,
          isLocked: false,
          rejectionReason: upstreamReason,
          upstreamReason,
          adminNotes: expect.stringContaining(upstreamReason),
        },
      });
    });
  });

  describe('Event Lifecycle: release.youtube_linked', () => {
    it('should save youtubeVideoId and live watchUrl for linked track', async () => {
      const now = Math.floor(Date.now() / 1000);
      const event = {
        id: 'evt_yt_03',
        type: 'release.youtube_linked',
        timestamp: now,
        data: {
          releaseCode: 'REL-ROYAL-102',
          trackCode: 'TRK-003',
          youtubeVideoId: 'dQw4w9WgXcQ',
          watchUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
      };

      const rawPayload = JSON.stringify(event);
      const signature = generateValidSignature(rawPayload, now);

      (redis.get as jest.Mock).mockResolvedValueOnce(null);
      (redis.set as jest.Mock).mockResolvedValueOnce('OK');
      (prisma.release.update as jest.Mock).mockResolvedValueOnce({
        code: 'REL-ROYAL-102',
      });
      (prisma.track.update as jest.Mock).mockResolvedValueOnce({
        code: 'TRK-003',
      });

      await service.handleWebhook({
        signatureHeader: `t=${now},v1=${signature}`,
        rawBody: rawPayload,
      });

      expect(prisma.release.update).toHaveBeenCalledWith({
        where: { code: 'REL-ROYAL-102' },
        data: {
          status: ReleaseStatus.DISTRIBUTED,
          youtubeVideoId: 'dQw4w9WgXcQ',
          youtubeWatchUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
      });

      expect(prisma.track.update).toHaveBeenCalledWith({
        where: { code: 'TRK-003' },
        data: {
          audioUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
      });
    });
  });

  describe('Event Lifecycle: channel.approved', () => {
    it('should set VevoChannel status to APPROVED and save channelUrl and youtubeChannelId', async () => {
      const now = Math.floor(Date.now() / 1000);
      const event = {
        id: 'evt_chan_04',
        type: 'channel.approved',
        timestamp: now,
        data: {
          channelCode: 'VEVO-CHAN-001',
          channelUrl: 'https://www.youtube.com/@ArtistVEVO',
          youtubeChannelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        },
      };

      const rawPayload = JSON.stringify(event);
      const signature = generateValidSignature(rawPayload, now);

      (redis.get as jest.Mock).mockResolvedValueOnce(null);
      (redis.set as jest.Mock).mockResolvedValueOnce('OK');
      (prisma.vevoChannel.update as jest.Mock).mockResolvedValueOnce({
        code: 'VEVO-CHAN-001',
        status: 'APPROVED',
      });

      await service.handleWebhook({
        signatureHeader: `t=${now},v1=${signature}`,
        rawBody: rawPayload,
      });

      expect(prisma.vevoChannel.update).toHaveBeenCalledWith({
        where: { code: 'VEVO-CHAN-001' },
        data: {
          status: 'APPROVED',
          channelUrl: 'https://www.youtube.com/@ArtistVEVO',
          youtubeChannelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        },
      });
    });
  });
});
