import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import request from 'supertest';
import { AdminReportsController } from '../src/platform/admin/reports/admin-reports.controller';
import { AdminReportsService } from '../src/platform/admin/reports/admin-reports.service';
import { DspReportIngestionService } from '../src/platform/admin/reports/dsp-report-ingestion.service';
import { RoyaltyRunService } from '../src/platform/admin/reports/royalty-run.service';
import { WhitelabelContractsService } from '../src/whitelabel/contracts/whitelabel-contracts.service';
import { PrismaService } from '../src/lib/prisma/prisma.service';
import { StorageService } from '../src/lib/storage/storage.service';
import { RolesGuard } from '../src/platform/guard/roles.guard';
import {
  ContractLevel,
  ContractStatus,
  DspStore,
  PayeeRole,
  RoyaltyRunStatus,
} from '../src/generated/prisma/client';

describe('DSP Royalty Pipeline Lifecycle (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;

  const mockAdminUser = {
    id: 'admin-royalty-01',
    code: 'RMIT-PLU-0000001',
    email: 'finance@royalmotionit.com',
    role: 'OWNER',
  };

  const mockWhiteLabel = {
    id: 'wl-royalty-01',
    code: 'RMIT-WL-0000003',
    name: 'Royalty WhiteLabel',
  };

  const mockPayeeArtist = {
    id: 'payee-artist-01',
    code: 'RMIT-PAYEE-0000001',
    name: 'Tashfiq Artist',
    email: 'tashfiq@royalmotionit.com',
    whiteLabelId: mockWhiteLabel.id,
  };

  const mockPayeeProducer = {
    id: 'payee-producer-02',
    code: 'RMIT-PAYEE-0000002',
    name: 'Zahid Beats',
    email: 'zahid@royalmotionit.com',
    whiteLabelId: mockWhiteLabel.id,
  };

  const mockPayeeLabel = {
    id: 'payee-label-03',
    code: 'RMIT-PAYEE-0000003',
    name: 'Dhaka Soundworks',
    email: 'dhaka@royalmotionit.com',
    whiteLabelId: mockWhiteLabel.id,
  };

  const mockRelease: any = {
    id: 'rel-royalty-01',
    code: 'RMIT-REL-0000010',
    title: 'Moner Manush Album',
    upc: '793573199882',
    whiteLabelId: mockWhiteLabel.id,
    tracks: [] as any[],
  };

  const mockTrack1 = {
    id: 'trk-royalty-01',
    code: 'RMIT-TRK-0000010',
    title: 'Moner Manush',
    isrc: 'USRC12600010',
    releaseId: mockRelease.id,
    release: mockRelease,
  };

  const mockTrack2 = {
    id: 'trk-royalty-02',
    code: 'RMIT-TRK-0000011',
    title: 'Bhalo Bashi',
    isrc: 'USRC12600011',
    releaseId: mockRelease.id,
    release: mockRelease,
  };

  mockRelease.tracks = [mockTrack1, mockTrack2];

  const store = {
    dspRawReports: new Map<string, any>(),
    dspSaleLines: [] as any[],
    contracts: new Map<string, any>(),
    royaltyRuns: new Map<string, any>(),
    statements: [] as any[],
  };

  beforeAll(async () => {
    let codeSeq = 1;

    const mockPrismaService: any = {
      $queryRaw: jest.fn().mockImplementation(async () => {
        return [{ nextval: BigInt(codeSeq++) }];
      }),
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      $transaction: jest.fn(async (cb) => {
        if (typeof cb === 'function') {
          return await cb(mockPrismaService);
        }
        return await Promise.all(cb);
      }),
      track: {
        findMany: jest.fn().mockImplementation(async ({ where }) => {
          const isrcList: string[] = where?.isrc?.in || [];
          return [mockTrack1, mockTrack2].filter((t) =>
            isrcList.some((i) => i.toUpperCase() === t.isrc.toUpperCase()),
          );
        }),
      },
      release: {
        findMany: jest.fn().mockImplementation(async ({ where }) => {
          const upcList: string[] = where?.upc?.in || [];
          return [mockRelease].filter((r) => upcList.includes(r.upc));
        }),
      },
      payee: {
        findFirst: jest.fn().mockResolvedValue(mockPayeeArtist),
        create: jest.fn().mockResolvedValue(mockPayeeArtist),
      },
      dspRawReport: {
        create: jest.fn().mockImplementation(async ({ data }) => {
          const id = `report-${Date.now()}`;
          const report = { id, ...data, createdAt: new Date() };
          store.dspRawReports.set(id, report);
          return report;
        }),
      },
      dspSaleLine: {
        createMany: jest.fn().mockImplementation(async ({ data }) => {
          store.dspSaleLines.push(...data);
          return { count: data.length };
        }),
        findMany: jest.fn().mockImplementation(async ({ where }) => {
          return store.dspSaleLines.filter((l) => l.reportingPeriod === where.reportingPeriod);
        }),
      },
      contract: {
        create: jest.fn().mockImplementation(async ({ data }) => {
          const id = `ctr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          const contract = {
            id,
            ...data,
            contractPayees: (data.contractPayees?.create || []).map((cp: any) => ({
              ...cp,
              payee: [mockPayeeArtist, mockPayeeProducer, mockPayeeLabel].find((p) => p.id === cp.payeeId),
            })),
            contractAssets: data.contractAssets?.create || [],
          };
          store.contracts.set(id, contract);
          return contract;
        }),
        findFirst: jest.fn().mockImplementation(async ({ where }) => {
          for (const c of store.contracts.values()) {
            if (where.level && c.level !== where.level) continue;
            if (where.whiteLabelId && c.whiteLabelId !== where.whiteLabelId) continue;
            if (where.targetId && c.targetId && c.targetId !== where.targetId) continue;
            return c;
          }
          return null;
        }),
        findMany: jest.fn().mockImplementation(async () => Array.from(store.contracts.values())),
        count: jest.fn().mockImplementation(async () => store.contracts.size),
      },
      royaltyRun: {
        findFirst: jest.fn().mockImplementation(async ({ where }) => {
          for (const r of store.royaltyRuns.values()) {
            if (where.reportingPeriod && r.reportingPeriod === where.reportingPeriod) {
              if (where.status && r.status === where.status) return r;
            }
          }
          return null;
        }),
        create: jest.fn().mockImplementation(async ({ data }) => {
          const id = `run-${Date.now()}`;
          const run = { id, ...data, createdAt: new Date() };
          store.royaltyRuns.set(id, run);
          return run;
        }),
        update: jest.fn().mockImplementation(async ({ where, data }) => {
          const existing = store.royaltyRuns.get(where.id);
          const updated = { ...existing, ...data };
          store.royaltyRuns.set(where.id, updated);
          return updated;
        }),
        findMany: jest.fn().mockImplementation(async () => Array.from(store.royaltyRuns.values())),
        count: jest.fn().mockImplementation(async () => store.royaltyRuns.size),
      },
      userRoyaltyStatement: {
        create: jest.fn().mockImplementation(async ({ data }) => {
          const id = `stmt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          const stmt = { id, ...data, createdAt: new Date() };
          store.statements.push(stmt);
          return stmt;
        }),
        findMany: jest.fn().mockImplementation(async () => store.statements),
        count: jest.fn().mockImplementation(async () => store.statements.length),
      },
    };

    @Module({
      controllers: [AdminReportsController],
      providers: [
        AdminReportsService,
        DspReportIngestionService,
        RoyaltyRunService,
        WhitelabelContractsService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: StorageService,
          useValue: {
            getTenantPresignedUrl: jest.fn().mockResolvedValue('https://storage.example.com'),
            getFileUrl: jest.fn((k) => `https://cdn.example.com/${k}`),
          },
        },
      ],
    })
    class AdminReportsTestModule {}

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AdminReportsTestModule,
        RouterModule.register([
          {
            path: 'platform/admin',
            module: AdminReportsTestModule,
          },
        ]),
      ],
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
    app.use((req: any, res: any, next: any) => {
      req.user = mockAdminUser;
      next();
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Part 1: DSP CSV Sales Report Ingestion', () => {
    it('POST /platform/admin/reports/dsp-ingest - parses multi-store DSP sales report with matched & unmatched ISRCs', async () => {
      const csvContent = [
        'store,reporting_period,country_code,isrc,upc,track_title,artist_name,streams,downloads,gross_amount,net_amount',
        'SPOTIFY,2026-03,US,USRC12600010,793573199882,Moner Manush,Tashfiq,10000,0,40.00,28.00',
        'APPLE_MUSIC,2026-03,GB,USRC12600011,793573199882,Bhalo Bashi,Tashfiq,5000,10,35.00,24.50',
        'YOUTUBE,2026-03,BD,USRC12600010,793573199882,Moner Manush,Tashfiq,50000,0,25.00,17.50',
        'SPOTIFY,2026-03,US,USRC99999999,000000000000,Unregistered Track,Unknown,1200,0,6.00,4.20',
      ].join('\n');

      const res = await request(app.getHttpServer())
        .post('/platform/admin/reports/dsp-ingest')
        .send({
          store: DspStore.SPOTIFY,
          reportingPeriod: '2026-03',
          fileContent: csvContent,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.report.rowCount).toBe(4);
      expect(res.body.report.matchedCount).toBe(3);
      expect(res.body.report.unmatchedCount).toBe(1);
      expect(res.body.report.totalNetUsd).toBeCloseTo(74.20, 2);
    });

    it('POST /platform/admin/reports/dsp-ingest - rejects empty or header-only DSP CSV file', async () => {
      await request(app.getHttpServer())
        .post('/platform/admin/reports/dsp-ingest')
        .send({
          store: DspStore.SPOTIFY,
          reportingPeriod: '2026-03',
          fileContent: 'store,period,isrc\n',
        })
        .expect(400);
    });
  });

  describe('Part 2: Contract Split Precedence Hierarchy', () => {
    let contractsService: WhitelabelContractsService;

    beforeAll(() => {
      contractsService = app.get<WhitelabelContractsService>(WhitelabelContractsService);
    });

    it('creates contract splits and enforces 100% total allocation', async () => {
      // 1. Track Level Contract: 70% Artist / 30% Producer
      const trackContract = await contractsService.createContract({
        whiteLabelId: mockWhiteLabel.id,
        name: 'Moner Manush Track Agreement (70/30)',
        level: ContractLevel.TRACK,
        targetId: mockTrack1.id,
        status: ContractStatus.ACTIVE,
        splits: [
          { payeeId: mockPayeeArtist.id, percentage: 70.0, role: PayeeRole.ARTIST },
          { payeeId: mockPayeeProducer.id, percentage: 30.0, role: PayeeRole.PRODUCER },
        ],
      });

      expect(trackContract.splits).toHaveLength(2);

      // 2. Release Level Contract: 60% Label / 40% Artist
      const releaseContract = await contractsService.createContract({
        whiteLabelId: mockWhiteLabel.id,
        name: 'Album Standard Agreement (60/40)',
        level: ContractLevel.RELEASE,
        targetId: mockRelease.id,
        status: ContractStatus.ACTIVE,
        splits: [
          { payeeId: mockPayeeLabel.id, percentage: 60.0, role: PayeeRole.LABEL },
          { payeeId: mockPayeeArtist.id, percentage: 40.0, role: PayeeRole.ARTIST },
        ],
      });

      expect(releaseContract.splits).toHaveLength(2);

      // 3. Account Level Contract: 50% Label / 50% Artist
      const accountContract = await contractsService.createContract({
        whiteLabelId: mockWhiteLabel.id,
        name: 'Account Default Split (50/50)',
        level: ContractLevel.ACCOUNT,
        status: ContractStatus.ACTIVE,
        splits: [
          { payeeId: mockPayeeLabel.id, percentage: 50.0, role: PayeeRole.LABEL },
          { payeeId: mockPayeeArtist.id, percentage: 50.0, role: PayeeRole.ARTIST },
        ],
      });

      expect(accountContract.splits).toHaveLength(2);
    });

    it('rejects contract creation when total split percentage does not equal 100%', async () => {
      await expect(
        contractsService.createContract({
          whiteLabelId: mockWhiteLabel.id,
          name: 'Invalid Split Contract',
          level: ContractLevel.RELEASE,
          splits: [
            { payeeId: mockPayeeArtist.id, percentage: 60.0, role: PayeeRole.ARTIST },
            { payeeId: mockPayeeProducer.id, percentage: 30.0, role: PayeeRole.PRODUCER },
          ], // sums to 90%
        }),
      ).rejects.toThrow('Total payee split percentage must equal exactly 100%');
    });

    it('resolves track-level contract over release-level contract (Precedence Level 1)', async () => {
      const effective = await contractsService.resolveEffectiveContract({
        whiteLabelId: mockWhiteLabel.id,
        trackId: mockTrack1.id,
        releaseId: mockRelease.id,
      });

      expect(effective.level).toBe(ContractLevel.TRACK);
      const artistSplit = effective.splits.find((s: any) => s.payeeId === mockPayeeArtist.id);
      const producerSplit = effective.splits.find((s: any) => s.payeeId === mockPayeeProducer.id);
      expect(artistSplit?.percentage).toBe(70);
      expect(producerSplit?.percentage).toBe(30);
    });

    it('resolves release-level contract when no track contract exists (Precedence Level 2)', async () => {
      const effective = await contractsService.resolveEffectiveContract({
        whiteLabelId: mockWhiteLabel.id,
        releaseId: mockRelease.id,
      });

      expect(effective.level).toBe(ContractLevel.RELEASE);
      const labelSplit = effective.splits.find((s: any) => s.payeeId === mockPayeeLabel.id);
      expect(labelSplit?.percentage).toBe(60);
    });
  });

  describe('Part 3: Royalty Run Execution & Statement Generation', () => {
    it('POST /platform/admin/reports/royalty-runs - executes royalty calculation with USD and BDT conversions', async () => {
      const res = await request(app.getHttpServer())
        .post('/platform/admin/reports/royalty-runs')
        .send({
          period: '2026-03',
          exchangeRateUsdToBdt: 120.0,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.matchedLinesCount).toBe(3);
      expect(res.body.unmatchedLinesCount).toBe(1);

      // Net USD total for matched lines:
      // Track 1 (Moner Manush): $28.00 (Spotify) + $17.50 (YouTube) = $45.50
      // Track 2 (Bhalo Bashi): $24.50 (Apple Music)
      // Total Matched USD: $70.00
      // BDT @ 120.0: 70.00 * 120 = ৳8,400.00
      expect(res.body.totalRevenueUsd).toBeCloseTo(70.0, 1);
      expect(res.body.totalRevenueBdt).toBeCloseTo(8400.0, 1);

      // Verify statements were persisted
      expect(store.statements.length).toBeGreaterThan(0);
      const artistStatements = store.statements.filter((s) => s.payeeId === mockPayeeArtist.id);
      expect(artistStatements.length).toBeGreaterThan(0);

      for (const stmt of store.statements) {
        expect(stmt.reportingPeriod).toBe('2026-03');
        expect(Number(stmt.netEarningsBdt)).toBeCloseTo(
          Number(stmt.netEarningsUsd) * 120.0,
          1,
        );
        expect(stmt.isPaid).toBe(false);
      }
    });

    it('POST /platform/admin/reports/royalty-runs - rejects invalid period format', async () => {
      await request(app.getHttpServer())
        .post('/platform/admin/reports/royalty-runs')
        .send({
          period: '2026-3', // Missing leading zero
          exchangeRateUsdToBdt: 120.0,
        })
        .expect(400);
    });

    it('POST /platform/admin/reports/royalty-runs - prevents duplicate completed royalty runs for same period', async () => {
      await request(app.getHttpServer())
        .post('/platform/admin/reports/royalty-runs')
        .send({
          period: '2026-03',
          exchangeRateUsdToBdt: 120.0,
        })
        .expect(400);
    });
  });
});
