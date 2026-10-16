import { Test, TestingModule } from '@nestjs/testing';
import {
  WhitelabelQcValidationService,
  QcSeverity,
  QcValidationResult,
  ReleaseValidationInput,
} from './whitelabel-qc-validation.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { AcrCloudService } from 'src/lib/acrcloud/acrcloud.service';

describe('WhitelabelQcValidationService', () => {
  let service: WhitelabelQcValidationService;
  let prismaMock: {
    release: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
    };
    track: {
      findMany: jest.Mock;
    };
  };
  let acrCloudMock: {
    scanTrack: jest.Mock;
    identifyAudio: jest.Mock;
  };

  beforeEach(async () => {
    prismaMock = {
      release: {
        findUnique: (jest.MockedFunction = jest.fn()),
        findFirst: jest.fn(),
      },
      track: {
        findMany: jest.fn(),
      },
    };

    acrCloudMock = {
      scanTrack: jest.fn(),
      identifyAudio: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhitelabelQcValidationService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: AcrCloudService,
          useValue: acrCloudMock,
        },
      ],
    }).compile();

    service = module.get<WhitelabelQcValidationService>(
      WhitelabelQcValidationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createBaseRelease = (
    overrides: Partial<ReleaseValidationInput> = {},
  ): ReleaseValidationInput => ({
    id: 'release-1',
    code: 'REL-001',
    title: 'Midnight Echoes',
    coverArtKey: 'catalog/wl-1/artwork/cover.jpg',
    tracks: [
      {
        id: 'track-1',
        code: 'TRK-001',
        title: 'Midnight Echoes',
        isrc: 'USRC12345678',
        audioKey: 'catalog/wl-1/audio/track1.wav',
        audioScan: {
          status: 'CLEAN',
          matchScore: 0,
        },
      },
    ],
    ...overrides,
  });

  describe('Severity 1 Checks (Hard Distribution Blockers)', () => {
    it('should return Severity 1 error when cover artwork is missing (null or empty)', async () => {
      const releaseMissingCover = createBaseRelease({
        coverArtKey: null,
      });

      const result: QcValidationResult =
        await service.validateRelease(releaseMissingCover);

      expect(result.isValid).toBe(false);
      const coverError = result.errors.find(
        (e) =>
          e.severity === QcSeverity.SEVERITY_1 &&
          e.message.includes('Release level: Cover image is missing'),
      );
      expect(coverError).toBeDefined();
      expect(coverError?.message).toBe('Release level: Cover image is missing');
    });

    it('should return Severity 1 error when release has zero tracks', async () => {
      const releaseWithNoTracks = createBaseRelease({
        tracks: [],
      });

      const result: QcValidationResult =
        await service.validateRelease(releaseWithNoTracks);

      expect(result.isValid).toBe(false);
      const trackError = result.errors.find(
        (e) =>
          e.severity === QcSeverity.SEVERITY_1 &&
          e.message.includes('Release level: At least one track is required'),
      );
      expect(trackError).toBeDefined();
      expect(trackError?.message).toBe(
        'Release level: At least one track is required',
      );
    });

    it('should return Severity 1 error when track has an invalid ISRC format (XYZ123)', async () => {
      const releaseWithInvalidIsrc = createBaseRelease({
        tracks: [
          {
            id: 'track-invalid-isrc',
            code: 'TRK-002',
            title: 'Electric Groove',
            isrc: 'XYZ123',
            audioKey: 'catalog/wl-1/audio/track2.wav',
          },
        ],
      });

      const result: QcValidationResult = await service.validateRelease(
        releaseWithInvalidIsrc,
      );

      expect(result.isValid).toBe(false);
      const isrcError = result.errors.find(
        (e) =>
          e.severity === QcSeverity.SEVERITY_1 &&
          e.message.includes('Invalid ISRC format'),
      );
      expect(isrcError).toBeDefined();
      expect(isrcError?.trackId).toBe('track-invalid-isrc');
    });

    it('should return Severity 1 error when ACRCloud copyright match score >= 80', async () => {
      const releaseWithCopyrightMatch = createBaseRelease({
        tracks: [
          {
            id: 'track-copyright',
            code: 'TRK-003',
            title: 'Sampled Melody',
            isrc: 'USRC12345678',
            audioKey: 'catalog/wl-1/audio/track3.wav',
            audioScan: {
              status: 'MATCH_FOUND',
              matchScore: 85,
            },
          },
        ],
      });

      const result: QcValidationResult = await service.validateRelease(
        releaseWithCopyrightMatch,
      );

      expect(result.isValid).toBe(false);
      const copyrightError = result.errors.find(
        (e) =>
          e.severity === QcSeverity.SEVERITY_1 &&
          e.message.includes('ACRCloud Copyright match detected'),
      );
      expect(copyrightError).toBeDefined();
      expect(copyrightError?.message).toContain(
        'ACRCloud Copyright match detected',
      );
    });

    it('should NOT return copyright Severity 1 error when ACRCloud match score is strictly below 80', async () => {
      const releaseWithLowScore = createBaseRelease({
        tracks: [
          {
            id: 'track-low-score',
            code: 'TRK-004',
            title: 'Subtle Influence',
            isrc: 'USRC12345678',
            audioKey: 'catalog/wl-1/audio/track4.wav',
            audioScan: {
              status: 'MATCH_FOUND',
              matchScore: 79,
            },
          },
        ],
      });

      const result: QcValidationResult =
        await service.validateRelease(releaseWithLowScore);

      const copyrightError = result.errors.find((e) =>
        e.message.includes('ACRCloud Copyright match detected'),
      );
      expect(copyrightError).toBeUndefined();
    });
  });

  describe('Severity 2 Checks (Quality & Metadata Warnings)', () => {
    it('should return Severity 2 warning for title casing issues (all caps)', async () => {
      const releaseWithAllCaps = createBaseRelease({
        title: 'MY ALL CAPS TITLE',
      });

      const result: QcValidationResult =
        await service.validateRelease(releaseWithAllCaps);

      const titleWarning = result.warnings.find(
        (w) =>
          w.severity === QcSeverity.SEVERITY_2 &&
          w.message.toLowerCase().includes('casing'),
      );
      expect(titleWarning).toBeDefined();
    });

    it('should return Severity 2 warning for title casing issues (all lowercase)', async () => {
      const releaseWithAllLower = createBaseRelease({
        title: 'all lowercase release title',
      });

      const result: QcValidationResult =
        await service.validateRelease(releaseWithAllLower);

      const titleWarning = result.warnings.find(
        (w) =>
          w.severity === QcSeverity.SEVERITY_2 &&
          w.message.toLowerCase().includes('casing'),
      );
      expect(titleWarning).toBeDefined();
    });
  });

  describe('Full Release Conformance & Pass Cases', () => {
    it('should pass ISRC check when valid ISRC format (USRC12345678) is provided', async () => {
      const release = createBaseRelease({
        tracks: [
          {
            id: 'track-valid',
            code: 'TRK-005',
            title: 'Valid Track',
            isrc: 'USRC12345678',
            audioKey: 'catalog/wl-1/audio/valid.wav',
          },
        ],
      });

      const result: QcValidationResult = await service.validateRelease(release);

      const isrcErrors = result.errors.filter((e) =>
        e.message.includes('Invalid ISRC format'),
      );
      expect(isrcErrors).toHaveLength(0);
    });

    it('should return isValid: true with 0 Severity 1 errors for a fully valid release', async () => {
      const fullyValidRelease = createBaseRelease({
        title: 'Serenade of Silence',
        coverArtKey: 'catalog/wl-1/artwork/valid_cover.png',
        tracks: [
          {
            id: 'track-perfect-1',
            code: 'TRK-101',
            title: 'First Light',
            isrc: 'USRC12345678',
            audioKey: 'catalog/wl-1/audio/track101.wav',
            audioScan: {
              status: 'CLEAN',
              matchScore: 0,
            },
          },
          {
            id: 'track-perfect-2',
            code: 'TRK-102',
            title: 'Second Sun',
            isrc: 'GBRC87654321',
            audioKey: 'catalog/wl-1/audio/track102.wav',
            audioScan: {
              status: 'CLEAN',
              matchScore: 12,
            },
          },
        ],
      });

      const result: QcValidationResult =
        await service.validateRelease(fullyValidRelease);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(
        result.errors.filter((e) => e.severity === QcSeverity.SEVERITY_1),
      ).toHaveLength(0);
    });
  });
});
