import { Test, TestingModule } from '@nestjs/testing';
import {
  RoyaltyRunService,
  DspSalesLine,
  ExecuteRoyaltyRunParams,
  RoyaltyRunResult,
} from './royalty-run.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { WhitelabelContractsService } from 'src/whitelabel/contracts/whitelabel-contracts.service';
import { StorageService } from 'src/lib/storage/storage.service';

describe('RoyaltyRunService', () => {
  let service: RoyaltyRunService;
  let prismaMock: {
    track: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    distributionReport: {
      create: jest.Mock;
    };
  };
  let contractsServiceMock: {
    resolveEffectiveContract: jest.Mock;
  };
  let storageServiceMock: {
    getFileBuffer: jest.Mock;
    getPresignedUrl: jest.Mock;
  };

  beforeEach(async () => {
    prismaMock = {
      track: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      distributionReport: {
        create: jest.fn(),
      },
    };

    contractsServiceMock = {
      resolveEffectiveContract: jest.fn(),
    };

    storageServiceMock = {
      getFileBuffer: jest.fn(),
      getPresignedUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoyaltyRunService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: WhitelabelContractsService,
          useValue: contractsServiceMock,
        },
        {
          provide: StorageService,
          useValue: storageServiceMock,
        },
      ],
    }).compile();

    service = module.get<RoyaltyRunService>(RoyaltyRunService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('DSP Ingestion & ISRC Matching', () => {
    it('should ingest mock DSP lines and match tracks by ISRC', async () => {
      const mockDspLines: DspSalesLine[] = [
        {
          isrc: 'USRC12345678',
          streams: 25000,
          netRevenueUsd: 1000,
          dsp: 'Spotify',
          country: 'US',
        },
        {
          isrc: 'GBRC87654321',
          streams: 10000,
          netRevenueUsd: 500,
          dsp: 'Apple Music',
          country: 'GB',
        },
      ];

      prismaMock.track.findMany.mockResolvedValue([
        {
          id: 'track-1',
          isrc: 'USRC12345678',
          title: 'Midnight Echoes',
          releaseId: 'rel-1',
          release: { whiteLabelId: 'wl-1' },
        },
        {
          id: 'track-2',
          isrc: 'GBRC87654321',
          title: 'Neon Skyline',
          releaseId: 'rel-2',
          release: { whiteLabelId: 'wl-1' },
        },
      ]);

      contractsServiceMock.resolveEffectiveContract.mockResolvedValue({
        id: 'contract-default',
        splits: [{ payeeId: 'payee-standard', percentage: 100 }],
      });

      const params: ExecuteRoyaltyRunParams = {
        whiteLabelId: 'wl-1',
        reportingPeriod: '2026-03',
        exchangeRateUsdToBdt: 120.0,
        lines: mockDspLines,
      };

      const result: RoyaltyRunResult = await service.executeRoyaltyRun(params);

      expect(result).toBeDefined();
      expect(result.matchedLinesCount).toBe(2);
      expect(result.unmatchedLinesCount).toBe(0);
      expect(result.totalStreams).toBe(35000);
      expect(result.totalRevenueUsd).toBe(1500.0);
    });

    it('should flag unmatched DSP lines and segregate them to suspense without failing the run', async () => {
      const mixedLines: DspSalesLine[] = [
        {
          isrc: 'USRC12345678',
          streams: 5000,
          netRevenueUsd: 200,
          dsp: 'Spotify',
        },
        {
          isrc: 'UNKNOWN99999',
          streams: 1000,
          netRevenueUsd: 50,
          dsp: 'Deezer',
        },
      ];

      prismaMock.track.findMany.mockResolvedValue([
        {
          id: 'track-1',
          isrc: 'USRC12345678',
          title: 'Matched Track',
          releaseId: 'rel-1',
          release: { whiteLabelId: 'wl-1' },
        },
      ]);

      contractsServiceMock.resolveEffectiveContract.mockResolvedValue({
        id: 'contract-1',
        splits: [{ payeeId: 'payee-1', percentage: 100 }],
      });

      const result = await service.executeRoyaltyRun({
        whiteLabelId: 'wl-1',
        reportingPeriod: '2026-03',
        exchangeRateUsdToBdt: 120.0,
        lines: mixedLines,
      });

      expect(result.matchedLinesCount).toBe(1);
      expect(result.unmatchedLinesCount).toBe(1);
      expect(result.unmatchedLines[0].isrc).toBe('UNKNOWN99999');
    });
  });

  describe('Payee Splits & Currency Conversion', () => {
    it('should apply 60/40 payee split to $1000 net revenue ($600 to Payee A, $400 to Payee B)', async () => {
      const singleLine: DspSalesLine[] = [
        {
          isrc: 'USRC12345678',
          streams: 100000,
          netRevenueUsd: 1000.0,
          dsp: 'Spotify',
        },
      ];

      prismaMock.track.findMany.mockResolvedValue([
        {
          id: 'track-split-1',
          isrc: 'USRC12345678',
          title: 'Duet Hit',
          releaseId: 'rel-split',
          release: { whiteLabelId: 'wl-1' },
        },
      ]);

      contractsServiceMock.resolveEffectiveContract.mockResolvedValue({
        id: 'contract-60-40',
        name: '60/40 Split',
        splits: [
          { payeeId: 'payee-a', percentage: 60 },
          { payeeId: 'payee-b', percentage: 40 },
        ],
      });

      const result = await service.executeRoyaltyRun({
        whiteLabelId: 'wl-1',
        reportingPeriod: '2026-03',
        exchangeRateUsdToBdt: 120.0,
        lines: singleLine,
      });

      const payeeA = result.payeeSummaries.find((p) => p.payeeId === 'payee-a');
      const payeeB = result.payeeSummaries.find((p) => p.payeeId === 'payee-b');

      expect(payeeA).toBeDefined();
      expect(payeeB).toBeDefined();
      expect(payeeA?.revenueUsd).toBe(600.0);
      expect(payeeB?.revenueUsd).toBe(400.0);
      expect(payeeA!.revenueUsd + payeeB!.revenueUsd).toBe(1000.0);
    });

    it('should correctly compute USD to BDT currency conversion', async () => {
      const line: DspSalesLine[] = [
        {
          isrc: 'USRC12345678',
          streams: 100000,
          netRevenueUsd: 1000.0,
          dsp: 'Spotify',
        },
      ];

      prismaMock.track.findMany.mockResolvedValue([
        {
          id: 'track-bdt',
          isrc: 'USRC12345678',
          title: 'Dhaka Beats',
          releaseId: 'rel-bdt',
          release: { whiteLabelId: 'wl-1' },
        },
      ]);

      contractsServiceMock.resolveEffectiveContract.mockResolvedValue({
        id: 'contract-60-40',
        splits: [
          { payeeId: 'payee-a', percentage: 60 },
          { payeeId: 'payee-b', percentage: 40 },
        ],
      });

      const exchangeRate = 120.0;
      const result = await service.executeRoyaltyRun({
        whiteLabelId: 'wl-1',
        reportingPeriod: '2026-03',
        exchangeRateUsdToBdt: exchangeRate,
        lines: line,
      });

      // Total BDT: $1000 * 120 = 120,000 BDT
      expect(result.totalRevenueBdt).toBe(120000.0);

      const payeeA = result.payeeSummaries.find((p) => p.payeeId === 'payee-a');
      const payeeB = result.payeeSummaries.find((p) => p.payeeId === 'payee-b');

      // Payee A: $600 * 120 = 72,000 BDT
      expect(payeeA?.revenueBdt).toBe(72000.0);

      // Payee B: $400 * 120 = 48,000 BDT
      expect(payeeB?.revenueBdt).toBe(48000.0);
    });

    it('should accurately handle fractional currency conversion rates with 2 decimal places rounding', async () => {
      const line: DspSalesLine[] = [
        {
          isrc: 'USRC12345678',
          streams: 10000,
          netRevenueUsd: 100.0,
          dsp: 'Apple Music',
        },
      ];

      prismaMock.track.findMany.mockResolvedValue([
        {
          id: 'track-precision',
          isrc: 'USRC12345678',
          releaseId: 'rel-1',
          release: { whiteLabelId: 'wl-1' },
        },
      ]);

      contractsServiceMock.resolveEffectiveContract.mockResolvedValue({
        id: 'contract-60-40',
        splits: [
          { payeeId: 'payee-a', percentage: 60 },
          { payeeId: 'payee-b', percentage: 40 },
        ],
      });

      const floatingRate = 121.75; // 100 * 121.75 = 12175.00
      const result = await service.executeRoyaltyRun({
        whiteLabelId: 'wl-1',
        reportingPeriod: '2026-03',
        exchangeRateUsdToBdt: floatingRate,
        lines: line,
      });

      expect(result.totalRevenueBdt).toBe(12175.0);
      const payeeA = result.payeeSummaries.find((p) => p.payeeId === 'payee-a');
      const payeeB = result.payeeSummaries.find((p) => p.payeeId === 'payee-b');

      // Payee A: $60 * 121.75 = 7305.00
      expect(payeeA?.revenueBdt).toBe(7305.0);
      // Payee B: $40 * 121.75 = 4870.00
      expect(payeeB?.revenueBdt).toBe(4870.0);
    });
  });
});
