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
import { AnsWebhookController } from '../src/platform/webhooks/ans-webhook.controller';
import { AnsWebhookService } from '../src/platform/webhooks/ans-webhook.service';
import { AdminDistributionController } from '../src/platform/admin/distribution/admin-distribution.controller';
import { AdminDistributionService } from '../src/platform/admin/distribution/admin-distribution.service';
import { AnsDispatchService } from '../src/platform/admin/distribution/ans-dispatch.service';
import { AnsMusicClientService } from '../src/lib/ans-music/ans-music-client.service';
import { DdexGeneratorService } from '../src/lib/ddex/ddex-generator.service';
import { PrismaService } from '../src/lib/prisma/prisma.service';
import { RedisService } from '../src/lib/redis/redis.service';
import { StorageService } from '../src/lib/storage/storage.service';
import { AcrCloudService } from '../src/lib/acrcloud/acrcloud.service';
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from '../src/platform/guard/roles.guard';
import {
  ReleaseStatus,
  ReleaseType,
  QcStatus,
  UpstreamStatus,
} from '../src/generated/prisma/client';

describe('Release Distribution Lifecycle (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  const WEBHOOK_SECRET = 'rmit_ans_webhook_hmac_secret_2026_secure';

  const mockWhiteLabel = {
    id: 'wl-prod-01',
    code: 'RMIT-WL-0000001',
    name: 'RoyalMotion WhiteLabel Partner',
    subdomain: 'records',
    customDomain: 'records.royalmotionit.com',
    status: 'ACTIVE',
    awsRegion: 'ap-southeast-1',
    awsAccessKeyId: 'MOCK_KEY',
    awsSecretAccessKey: 'MOCK_SECRET',
    bucketName: 'royalmotion-wl-records',
  };

  const mockUser = {
    id: 'user-wl-01',
    code: 'RMIT-WLU-0000001',
    email: 'labelmanager@royalmotionit.com',
    role: 'ADMIN',
    whiteLabelId: mockWhiteLabel.id,
  };

  const mockAdminUser = {
    id: 'admin-platform-01',
    code: 'RMIT-PLU-0000001',
    email: 'admin@royalmotionit.com',
    role: 'OWNER',
  };

  // Stateful in-memory repository store
  const store = {
    releases: new Map<string, any>(),
    tracks: new Map<string, any>(),
    redis: new Map<string, string>(),
    seq: 1,
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
    let codeCounter = 1;

    const mockPrismaService: any = {
      $queryRaw: jest.fn().mockImplementation(async () => {
        return [{ nextval: BigInt(codeCounter++) }];
      }),
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      $transaction: jest.fn(async (arg) => {
        if (typeof arg === 'function') {
          return await arg(mockPrismaService);
        }
        return await Promise.all(arg);
      }),
      whiteLabel: {
        findUnique: jest.fn().mockImplementation(async ({ where }) => {
          if (where.id === mockWhiteLabel.id) return mockWhiteLabel;
          return null;
        }),
        findFirst: jest.fn().mockResolvedValue(mockWhiteLabel),
        update: jest.fn().mockResolvedValue(mockWhiteLabel),
      },
      release: {
        create: jest.fn().mockImplementation(async ({ data }) => {
          const id = `rel-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const releaseObj = {
            id,
            ...data,
            whiteLabel: mockWhiteLabel,
            tracks: [],
            contributors: [],
            isLocked: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          store.releases.set(releaseObj.code, releaseObj);
          store.releases.set(releaseObj.id, releaseObj);
          return releaseObj;
        }),
        findFirst: jest.fn().mockImplementation(async ({ where }) => {
          for (const rel of store.releases.values()) {
            if (where.code && rel.code === where.code) return rel;
            if (where.id && rel.id === where.id) return rel;
            if (where.OR) {
              for (const cond of where.OR) {
                if (cond.code && rel.code === cond.code) return rel;
                if (cond.id && rel.id === cond.id) return rel;
              }
            }
          }
          return null;
        }),
        findUnique: jest.fn().mockImplementation(async ({ where }) => {
          if (where.code) return store.releases.get(where.code) || null;
          if (where.id) return store.releases.get(where.id) || null;
          return null;
        }),
        findMany: jest
          .fn()
          .mockImplementation(async () =>
            Array.from(new Set(store.releases.values())),
          ),
        count: jest.fn().mockImplementation(async () => store.releases.size),
        update: jest.fn().mockImplementation(async ({ where, data }) => {
          const key = where.code || where.id;
          const existing =
            store.releases.get(key) || store.releases.get(where.id);
          if (!existing) throw new Error(`Release not found`);
          const updated = { ...existing, ...data, updatedAt: new Date() };
          store.releases.set(updated.code, updated);
          store.releases.set(updated.id, updated);
          return updated;
        }),
      },
      track: {
        create: jest.fn().mockImplementation(async ({ data }) => {
          const id = `trk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const trackObj = {
            id,
            ...data,
            contributors: [],
            audioScan: { status: 'CLEAN', matchScore: 0 },
            isLocked: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          store.tracks.set(trackObj.code, trackObj);
          store.tracks.set(trackObj.id, trackObj);

          // Add to release
          const rel = store.releases.get(data.releaseId);
          if (rel) {
            rel.tracks = rel.tracks || [];
            rel.tracks.push(trackObj);
          }
          return trackObj;
        }),
        findFirst: jest.fn().mockImplementation(async ({ where }) => {
          for (const trk of store.tracks.values()) {
            if (where.code && trk.code === where.code) return trk;
            if (where.id && trk.id === where.id) return trk;
            if (where.OR) {
              for (const cond of where.OR) {
                if (cond.code && trk.code === cond.code) return trk;
                if (cond.id && trk.id === cond.id) return trk;
              }
            }
          }
          return null;
        }),
        findMany: jest
          .fn()
          .mockImplementation(async () =>
            Array.from(new Set(store.tracks.values())),
          ),
        update: jest.fn().mockImplementation(async ({ where, data }) => {
          const key = where.code || where.id;
          const existing = store.tracks.get(key) || store.tracks.get(where.id);
          if (!existing) throw new Error(`Track not found`);
          const updated = { ...existing, ...data, updatedAt: new Date() };
          store.tracks.set(updated.code, updated);
          store.tracks.set(updated.id, updated);
          return updated;
        }),
        updateMany: jest.fn().mockImplementation(async ({ where, data }) => {
          let count = 0;
          for (const trk of store.tracks.values()) {
            const matchesCode = !where.code || trk.code === where.code;
            const matchesRel =
              !where.releaseId || trk.releaseId === where.releaseId;
            if (matchesCode && matchesRel) {
              Object.assign(trk, data);
              for (const rel of store.releases.values()) {
                if (rel.tracks) {
                  for (const t of rel.tracks) {
                    if (t.id === trk.id || t.code === trk.code) {
                      Object.assign(t, data);
                    }
                  }
                }
              }
              count++;
            }
          }
          return { count };
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

    const mockStorageService = {
      getTenantPresignedUploadUrl: jest
        .fn()
        .mockResolvedValue(
          'https://s3.ap-southeast-1.amazonaws.com/upload-signed',
        ),
      getTenantPresignedUrl: jest
        .fn()
        .mockResolvedValue(
          'https://s3.ap-southeast-1.amazonaws.com/file-stream',
        ),
      getPresignedUrl: jest
        .fn()
        .mockResolvedValue(
          'https://s3.ap-southeast-1.amazonaws.com/file-stream',
        ),
      getFileUrl: jest.fn((k: string) => `https://cdn.royalmotionit.com/${k}`),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      deleteTenantFile: jest.fn().mockResolvedValue(undefined),
    };

    const mockAcrCloudService = {
      scanTrack: jest
        .fn()
        .mockResolvedValue({ status: 'CLEAN', matchScore: 0 }),
      scanTrackByCode: jest
        .fn()
        .mockResolvedValue({ status: 'CLEAN', matchScore: 0 }),
      identifyAudio: jest.fn().mockResolvedValue({ isClean: true }),
    };

    const mockAnsMusicClient = {
      createRelease: jest.fn().mockImplementation(async (dto) => ({
        id: `ans_rel_${Date.now()}`,
        status: 'PENDING',
        upc: '840001234567',
        tracks: (dto.tracks || []).map((t: any) => ({
          externalId: t.externalId,
          isrc: 'USRC12600001',
        })),
      })),
      requestChannel: jest.fn().mockResolvedValue({ id: 'ans_chan_99' }),
      simulateStatus: jest.fn().mockResolvedValue({ success: true }),
    };

    const mockDdexService = {
      generateReleaseErnXml: jest.fn().mockResolvedValue('<ERN-XML></ERN-XML>'),
    };

    @Module({
      controllers: [WhitelabelCatalogController],
      providers: [
        WhitelabelCatalogService,
        WhitelabelQcValidationService,
        AnsDispatchService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: AcrCloudService, useValue: mockAcrCloudService },
        { provide: AnsMusicClientService, useValue: mockAnsMusicClient },
        { provide: DdexGeneratorService, useValue: mockDdexService },
      ],
    })
    class WhitelabelCatalogTestModule {}

    @Module({
      controllers: [AdminDistributionController],
      providers: [
        AdminDistributionService,
        AnsDispatchService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: AcrCloudService, useValue: mockAcrCloudService },
        { provide: AnsMusicClientService, useValue: mockAnsMusicClient },
        { provide: DdexGeneratorService, useValue: mockDdexService },
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

  let createdReleaseCode: string;
  let createdTrackCode: string;

  describe('Step 1: Draft Release Creation', () => {
    it('POST /whitelabel/catalog/releases - creates release draft with code RMIT-REL-*', async () => {
      const res = await request(app.getHttpServer())
        .post('/whitelabel/catalog/releases')
        .send({
          title: 'Neon Odyssey',
          type: ReleaseType.SINGLE,
          genre: 'Electronic',
          subgenre: 'Synthwave',
          labelName: 'RoyalMotion Records',
        })
        .expect(201);

      expect(res.body).toHaveProperty('code');
      expect(res.body.code).toMatch(/^RMIT-REL-\d{7}$/);
      expect(res.body.title).toBe('Neon Odyssey');
      expect(res.body.status).toBe(ReleaseStatus.DRAFT);
      expect(res.body.isLocked).toBe(false);

      createdReleaseCode = res.body.code;
    });

    it('POST /whitelabel/catalog/releases - rejects release creation without required title', async () => {
      await request(app.getHttpServer())
        .post('/whitelabel/catalog/releases')
        .send({
          genre: 'Electronic',
        })
        .expect(400);
    });
  });

  describe('Step 2: Track Addition with Lossless Metadata', () => {
    it('POST /whitelabel/catalog/releases/:code/tracks - adds track with FLAC metadata and ISRC', async () => {
      const res = await request(app.getHttpServer())
        .post(`/whitelabel/catalog/releases/${createdReleaseCode}/tracks`)
        .send({
          title: 'Neon Odyssey (Original Mix)',
          trackNumber: 1,
          durationSeconds: 215,
          audioKey: 'catalog/wl-prod-01/audio/neon-odyssey.flac',
          fileName: 'neon-odyssey.flac',
          fileSizeBytes: 45291820,
          mimeType: 'audio/flac',
          explicit: false,
          language: 'en',
        })
        .expect(201);

      expect(res.body).toHaveProperty('code');
      expect(res.body.code).toMatch(/^RMIT-TRK-\d{7}$/);
      expect(res.body.title).toBe('Neon Odyssey (Original Mix)');
      expect(res.body.audioKey).toBe(
        'catalog/wl-prod-01/audio/neon-odyssey.flac',
      );

      createdTrackCode = res.body.code;
    });

    it('POST /whitelabel/catalog/releases/:code/tracks - rejects track without audioKey', async () => {
      await request(app.getHttpServer())
        .post(`/whitelabel/catalog/releases/${createdReleaseCode}/tracks`)
        .send({
          title: 'Incomplete Track',
          trackNumber: 2,
        })
        .expect(400);
    });
  });

  describe('Step 3: Two-Tier Quality Control (QC) Validation', () => {
    it('POST /whitelabel/catalog/releases/:code/validate - fails with Severity 1 when cover art is missing', async () => {
      const res = await request(app.getHttpServer())
        .post(`/whitelabel/catalog/releases/${createdReleaseCode}/validate`)
        .expect(201);

      expect(res.body.isValid).toBe(false);
      expect(res.body.severity1Errors.length).toBeGreaterThan(0);
      expect(
        res.body.severity1Errors.some(
          (e: any) => e.code === 'MISSING_COVER_ARTWORK',
        ),
      ).toBe(true);
    });

    it('PUT /whitelabel/catalog/releases/:code - uploads valid cover art and re-validates to PASSED', async () => {
      await request(app.getHttpServer())
        .put(`/whitelabel/catalog/releases/${createdReleaseCode}`)
        .send({
          coverArtKey: 'catalog/wl-prod-01/artwork/cover-3000x3000.jpg',
        })
        .expect(200);

      const valRes = await request(app.getHttpServer())
        .post(`/whitelabel/catalog/releases/${createdReleaseCode}/validate`)
        .expect(201);

      expect(valRes.body.isValid).toBe(true);
      expect(valRes.body.severity1Errors).toHaveLength(0);
    });
  });

  describe('Step 4: Release Submission', () => {
    it('POST /whitelabel/catalog/releases/:code/submit - locks release and transitions to SUBMITTED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/whitelabel/catalog/releases/${createdReleaseCode}/submit`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.release.isLocked).toBe(true);

      const inspect = await request(app.getHttpServer())
        .get(`/whitelabel/catalog/releases/${createdReleaseCode}`)
        .expect(200);

      expect([ReleaseStatus.SUBMITTED, ReleaseStatus.DISTRIBUTED]).toContain(
        inspect.body.status,
      );
    });

    it('POST /whitelabel/catalog/releases/:code/tracks - forbids adding tracks to a locked/submitted release', async () => {
      await request(app.getHttpServer())
        .post(`/whitelabel/catalog/releases/${createdReleaseCode}/tracks`)
        .send({
          title: 'Late Addition',
          audioKey: 'late.flac',
        })
        .expect(403);
    });
  });

  describe('Step 5: Admin Upstream ANS Music Dispatch', () => {
    it('POST /platform/admin/distribution/releases/:code/ans-dispatch - dispatches release to ANS', async () => {
      // Simulate state prior to manual dispatch if auto-dispatch completed
      const rel = store.releases.get(createdReleaseCode);
      rel.isLocked = false;
      rel.status = ReleaseStatus.SUBMITTED;

      const res = await request(app.getHttpServer())
        .post(
          `/platform/admin/distribution/releases/${createdReleaseCode}/ans-dispatch`,
        )
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.ansReleaseId).toBeDefined();
    });
  });

  describe('Step 6: ANS Webhook Ingestion & UPC/ISRC Reconciliation', () => {
    it('POST /webhooks/ans-music - verifies HMAC signature and processes release.approved', async () => {
      const eventPayload = {
        id: `evt_appr_${Date.now()}`,
        type: 'release.approved',
        data: {
          releaseCode: createdReleaseCode,
          upc: '840001234567',
          tracks: [
            {
              trackCode: createdTrackCode,
              isrc: 'USRC12600001',
            },
          ],
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
    });

    it('POST /webhooks/ans-music - processes release.delivered and reconciles DISTRIBUTED status', async () => {
      const eventPayload = {
        id: `evt_deliv_${Date.now()}`,
        type: 'release.delivered',
        data: {
          releaseCode: createdReleaseCode,
        },
      };

      const ts = Math.floor(Date.now() / 1000);
      const signature = signWebhookPayload(eventPayload, ts);

      await request(app.getHttpServer())
        .post('/webhooks/ans-music')
        .set('x-ans-timestamp', String(ts))
        .set('x-ans-signature', `v1=${signature}`)
        .send(eventPayload)
        .expect(200);

      // Verify release state
      const verified = await request(app.getHttpServer())
        .get(`/whitelabel/catalog/releases/${createdReleaseCode}`)
        .expect(200);

      expect(verified.body.status).toBe(ReleaseStatus.DISTRIBUTED);
      expect(verified.body.upc).toBe('840001234567');
      expect(verified.body.tracks[0].isrc).toBe('USRC12600001');
    });

    it('POST /webhooks/ans-music - rejects webhook with invalid cryptographic signature', async () => {
      const eventPayload = {
        id: `evt_tampered_${Date.now()}`,
        type: 'release.delivered',
        data: { releaseCode: createdReleaseCode },
      };

      const ts = Math.floor(Date.now() / 1000);

      await request(app.getHttpServer())
        .post('/webhooks/ans-music')
        .set('x-ans-timestamp', String(ts))
        .set(
          'x-ans-signature',
          'v1=deadbeefcafebabe000000000000000000000000000000000000000000000000',
        )
        .send(eventPayload)
        .expect(401);
    });
  });
});
