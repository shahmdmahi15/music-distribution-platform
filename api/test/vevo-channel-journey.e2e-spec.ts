import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import request from 'supertest';
import express from 'express';
import * as crypto from 'crypto';
import { WhitelabelCatalogController } from '../src/whitelabel/catalog/whitelabel-catalog.controller';
import { WhitelabelCatalogService } from '../src/whitelabel/catalog/whitelabel-catalog.service';
import { WhitelabelQcValidationService } from '../src/whitelabel/catalog/validation/whitelabel-qc-validation.service';
import { WhitelabelSessionGuard } from '../src/whitelabel/guard/whitelabel-session.guard';
import { AdminDistributionController } from '../src/platform/admin/distribution/admin-distribution.controller';
import { AdminDistributionService } from '../src/platform/admin/distribution/admin-distribution.service';
import { AnsDispatchService } from '../src/platform/admin/distribution/ans-dispatch.service';
import { AnsMusicClientService } from '../src/lib/ans-music/ans-music-client.service';
import { DdexGeneratorService } from '../src/lib/ddex/ddex-generator.service';
import { AnsWebhookController } from '../src/platform/webhooks/ans-webhook.controller';
import { AnsWebhookService } from '../src/platform/webhooks/ans-webhook.service';
import { PrismaService } from '../src/lib/prisma/prisma.service';
import { RedisService } from '../src/lib/redis/redis.service';
import { StorageService } from '../src/lib/storage/storage.service';
import { AcrCloudService } from '../src/lib/acrcloud/acrcloud.service';
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from '../src/platform/guard/roles.guard';

describe('VEVO Channel Lifecycle Journey (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  const WEBHOOK_SECRET = 'rmit_ans_webhook_hmac_secret_2026_secure';

  const mockWhiteLabel = {
    id: 'wl-vevo-01',
    code: 'RMIT-WL-0000002',
    name: 'Bangla Beats Media',
    subdomain: 'banglabeats',
    status: 'ACTIVE',
  };

  const mockUser = {
    id: 'user-vevo-01',
    code: 'RMIT-WLU-0000002',
    email: 'creator@banglabeats.com',
    role: 'ADMIN',
    whiteLabelId: mockWhiteLabel.id,
  };

  const mockAdminUser = {
    id: 'admin-platform-01',
    code: 'RMIT-PLU-0000001',
    email: 'superadmin@royalmotionit.com',
    role: 'ADMIN',
  };

  const store = {
    channels: new Map<string, any>(),
    redis: new Map<string, string>(),
  };

  const signWebhookPayload = (payload: any, timestamp: number): string => {
    const rawBody = JSON.stringify(payload);
    const toSign = `${timestamp}.${rawBody}`;
    return crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(toSign)
      .digest('hex');
  };

  beforeAll(async () => {
    let codeSeq = 1;

    const mockPrismaService: any = {
      $queryRaw: jest.fn().mockImplementation(async () => {
        return [{ nextval: BigInt(codeSeq++) }];
      }),
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      $transaction: jest.fn(async (cb) =>
        typeof cb === 'function' ? cb(mockPrismaService) : Promise.all(cb),
      ),
      whiteLabel: {
        findUnique: jest.fn().mockResolvedValue(mockWhiteLabel),
      },
      vevoChannel: {
        create: jest.fn().mockImplementation(async ({ data }) => {
          const id = `chan-${Date.now()}`;
          const channel = {
            id,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          store.channels.set(channel.code, channel);
          store.channels.set(channel.id, channel);
          return channel;
        }),
        findFirst: jest.fn().mockImplementation(async ({ where }) => {
          for (const ch of store.channels.values()) {
            if (where.code && ch.code === where.code) return ch;
            if (where.id && ch.id === where.id) return ch;
            if (where.OR) {
              for (const orCond of where.OR) {
                if (orCond.code && ch.code === orCond.code) return ch;
                if (orCond.id && ch.id === orCond.id) return ch;
              }
            }
          }
          return null;
        }),
        findMany: jest
          .fn()
          .mockImplementation(async () =>
            Array.from(new Set(store.channels.values())),
          ),
        update: jest.fn().mockImplementation(async ({ where, data }) => {
          const key = where.code || where.id;
          const existing =
            store.channels.get(key) || store.channels.get(where.id);
          if (!existing) throw new Error('Channel not found');
          const updated = { ...existing, ...data, updatedAt: new Date() };
          store.channels.set(updated.code, updated);
          store.channels.set(updated.id, updated);
          return updated;
        }),
      },
      upstreamWebhookLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
    };

    const mockRedisService = {
      get: jest
        .fn()
        .mockImplementation(async (k: string) => store.redis.get(k) || null),
      set: jest.fn().mockImplementation(async (k: string, v: string) => {
        store.redis.set(k, v);
        return 'OK';
      }),
      del: jest
        .fn()
        .mockImplementation(async (k: string) => store.redis.delete(k)),
    };

    const mockAnsMusicClient = {
      requestChannel: jest.fn().mockImplementation(async (dto) => ({
        id: `ans_chan_${Date.now()}`,
        channelName: dto.channelName,
        status: 'SUBMITTED',
      })),
      createRelease: jest.fn(),
      simulateStatus: jest.fn(),
    };

    @Module({
      controllers: [WhitelabelCatalogController],
      providers: [
        WhitelabelCatalogService,
        WhitelabelQcValidationService,
        AnsDispatchService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        {
          provide: StorageService,
          useValue: {
            getTenantPresignedUrl: jest
              .fn()
              .mockResolvedValue('https://storage.example.com'),
            getFileUrl: jest.fn((k) => `https://cdn.example.com/${k}`),
          },
        },
        {
          provide: AcrCloudService,
          useValue: {
            scanTrack: jest.fn().mockResolvedValue({ status: 'CLEAN' }),
          },
        },
        { provide: AnsMusicClientService, useValue: mockAnsMusicClient },
        {
          provide: DdexGeneratorService,
          useValue: {
            generateReleaseErnXml: jest.fn().mockResolvedValue('<XML/>'),
          },
        },
      ],
    })
    class WhitelabelCatalogTestModule {}

    @Module({
      controllers: [AdminDistributionController],
      providers: [
        AdminDistributionService,
        AnsDispatchService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: StorageService,
          useValue: {
            getTenantPresignedUrl: jest
              .fn()
              .mockResolvedValue('https://storage.example.com'),
            getFileUrl: jest.fn((k) => `https://cdn.example.com/${k}`),
          },
        },
        {
          provide: AcrCloudService,
          useValue: {
            scanTrack: jest.fn().mockResolvedValue({ status: 'CLEAN' }),
          },
        },
        { provide: AnsMusicClientService, useValue: mockAnsMusicClient },
        {
          provide: DdexGeneratorService,
          useValue: {
            generateReleaseErnXml: jest.fn().mockResolvedValue('<XML/>'),
          },
        },
      ],
    })
    class AdminDistributionTestModule {}

    @Module({
      controllers: [AnsWebhookController],
      providers: [
        AnsWebhookService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'ANS_WEBHOOK_SECRET' ? WEBHOOK_SECRET : null,
            getOrThrow: (key: string) =>
              key === 'ANS_WEBHOOK_SECRET' ? WEBHOOK_SECRET : null,
          },
        },
      ],
    })
    class WebhooksTestModule {}

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        WhitelabelCatalogTestModule,
        AdminDistributionTestModule,
        WebhooksTestModule,
        RouterModule.register([
          {
            path: 'whitelabel',
            module: WhitelabelCatalogTestModule,
          },
          {
            path: 'platform/admin',
            module: AdminDistributionTestModule,
          },
        ]),
      ],
    })
      .overrideGuard(WhitelabelSessionGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.whiteLabel = mockWhiteLabel;
          req.user = mockUser;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockAdminUser;
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(
      express.json({
        verify: (req: any, res, buf) => {
          req.rawBody = buf.toString('utf-8');
        },
      }),
    );
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  let requestedChannelCode: string;

  describe('Step 1: User Submits VEVO Channel Request', () => {
    it('POST /whitelabel/catalog/channels - creates channel with initial status PENDING', async () => {
      const res = await request(app.getHttpServer())
        .post('/whitelabel/catalog/channels')
        .send({
          channelName: 'FarhanAliVEVO',
          artistName: 'Farhan Ali',
          description: 'Official artist VEVO channel for Farhan Ali',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.channel.code).toMatch(/^RMIT-VEVO-\d{7}$/);
      expect(res.body.channel.channelName).toBe('FarhanAliVEVO');
      expect(res.body.channel.status).toBe('PENDING');

      requestedChannelCode = res.body.channel.code;
    });

    it('GET /whitelabel/catalog/channels - lists submitted channels for WhiteLabel tenant', async () => {
      const res = await request(app.getHttpServer())
        .get('/whitelabel/catalog/channels')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.channels)).toBe(true);
      expect(
        res.body.channels.some((c: any) => c.code === requestedChannelCode),
      ).toBe(true);
    });
  });

  describe('Step 2: Admin Dispatches Channel Request to ANS', () => {
    it('POST /platform/admin/distribution/channels/:code/ans-dispatch - dispatches channel to ANS', async () => {
      // Simulate state prior to dispatch
      const ch = store.channels.get(requestedChannelCode);
      ch.status = 'PENDING';

      const res = await request(app.getHttpServer())
        .post(
          `/platform/admin/distribution/channels/${requestedChannelCode}/ans-dispatch`,
        )
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.channelCode).toBe(requestedChannelCode);
      expect(res.body.ansChannelId).toBeDefined();

      const updated = store.channels.get(requestedChannelCode);
      expect(updated.status).toBe('SUBMITTED');
    });

    it('POST /platform/admin/distribution/channels/:code/ans-dispatch - returns 409 Conflict if channel already submitted', async () => {
      await request(app.getHttpServer())
        .post(
          `/platform/admin/distribution/channels/${requestedChannelCode}/ans-dispatch`,
        )
        .expect(409);
    });
  });

  describe('Step 3: Webhook Receives channel.approved', () => {
    it('POST /webhooks/ans-music - verifies HMAC signature and approves channel with YouTube metadata', async () => {
      const eventPayload = {
        id: `evt_chan_appr_${Date.now()}`,
        type: 'channel.approved',
        data: {
          channelCode: requestedChannelCode,
          channelUrl: 'https://www.youtube.com/@FarhanAliVEVO',
          youtubeChannelId: 'UC9900FarhanAliVevoId',
        },
      };

      const ts = Math.floor(Date.now() / 1000);
      const signature = signWebhookPayload(eventPayload, ts);

      const res = await request(app.getHttpServer())
        .post('/webhooks/ans-music')
        .set('x-ans-timestamp', String(ts))
        .set('x-ans-signature', `v1=${signature}`)
        .send(eventPayload)
        .expect(200);

      expect(res.body.received).toBe(true);

      const channelRecord = store.channels.get(requestedChannelCode);
      expect(channelRecord.status).toBe('APPROVED');
      expect(channelRecord.channelUrl).toBe(
        'https://www.youtube.com/@FarhanAliVEVO',
      );
      expect(channelRecord.youtubeChannelId).toBe('UC9900FarhanAliVevoId');
    });

    it('POST /webhooks/ans-music - deduplicates replayed event ID', async () => {
      const eventId = `evt_dedup_${Date.now()}`;
      const eventPayload = {
        id: eventId,
        type: 'channel.approved',
        data: { channelCode: requestedChannelCode },
      };

      const ts = Math.floor(Date.now() / 1000);
      const sig = signWebhookPayload(eventPayload, ts);

      // First delivery
      await request(app.getHttpServer())
        .post('/webhooks/ans-music')
        .set('x-ans-timestamp', String(ts))
        .set('x-ans-signature', `v1=${sig}`)
        .send(eventPayload)
        .expect(200);

      // Replay delivery
      const replayRes = await request(app.getHttpServer())
        .post('/webhooks/ans-music')
        .set('x-ans-timestamp', String(ts))
        .set('x-ans-signature', `v1=${sig}`)
        .send(eventPayload)
        .expect(200);

      expect(replayRes.body.deduplicated).toBe(true);
    });

    it('POST /webhooks/ans-music - rejects webhook when timestamp drift exceeds 300s', async () => {
      const eventPayload = {
        id: `evt_expired_${Date.now()}`,
        type: 'channel.approved',
        data: { channelCode: requestedChannelCode },
      };

      const expiredTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour old
      const signature = signWebhookPayload(eventPayload, expiredTimestamp);

      await request(app.getHttpServer())
        .post('/webhooks/ans-music')
        .set('x-ans-timestamp', String(expiredTimestamp))
        .set('x-ans-signature', `v1=${signature}`)
        .send(eventPayload)
        .expect(401);
    });
  });
});
