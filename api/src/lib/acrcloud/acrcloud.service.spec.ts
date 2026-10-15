import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AcrCloudService } from './acrcloud.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  createMockPrismaService,
  createMockStorageService,
  createMockConfigService,
} from '../../../test/mocks/mock-services';
import { AudioScanStatus } from 'src/generated/prisma/client';

describe('AcrCloudService', () => {
  let service: AcrCloudService;
  let mockPrisma: any;
  let mockStorage: any;
  let mockConfig: any;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockStorage = createMockStorageService();
    mockConfig = createMockConfigService({
      ACRCLOUD_HOST: 'identify-eu-west-1.acrcloud.com',
      ACRCLOUD_ACCESS_KEY: 'test-access-key-123',
      ACRCLOUD_ACCESS_SECRET: 'test-access-secret-456',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcrCloudService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AcrCloudService>(AcrCloudService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateSignature', () => {
    it('should generate a valid HMAC-SHA1 base64 signature', () => {
      const sig = service.generateSignature(
        'POST',
        '/v1/identify',
        'key123',
        'audio',
        '1',
        '1600000000',
        'secret456',
      );

      expect(typeof sig).toBe('string');
      expect(sig.length).toBeGreaterThan(0);

      // Verify deterministic output
      const sig2 = service.generateSignature(
        'POST',
        '/v1/identify',
        'key123',
        'audio',
        '1',
        '1600000000',
        'secret456',
      );
      expect(sig).toEqual(sig2);
    });
  });

  describe('isConfigured', () => {
    it('should return true when all credentials are set', () => {
      expect(service.isConfigured()).toBe(true);
    });

    it('should return false when credentials are missing', async () => {
      const unconfiguredConfig = createMockConfigService({});
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AcrCloudService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: StorageService, useValue: mockStorage },
          { provide: ConfigService, useValue: unconfiguredConfig },
        ],
      }).compile();

      const unconfiguredService = module.get<AcrCloudService>(AcrCloudService);
      expect(unconfiguredService.isConfigured()).toBe(false);
    });
  });

  describe('identifyAudio', () => {
    it('should gracefully return clean if unconfigured', async () => {
      const unconfiguredConfig = createMockConfigService({});
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AcrCloudService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: StorageService, useValue: mockStorage },
          { provide: ConfigService, useValue: unconfiguredConfig },
        ],
      }).compile();

      const unconfiguredService = module.get<AcrCloudService>(AcrCloudService);
      const res = await unconfiguredService.identifyAudio(Buffer.from('sample-audio-bytes'));

      expect(res.isClean).toBe(true);
      expect(res.hasMatch).toBe(false);
      expect(res.statusCode).toBe(1001);
    });

    it('should detect copyright match when ACRCloud returns code 0 with music', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: { code: 0, msg: 'Success' },
          metadata: {
            music: [
              {
                title: 'Starlight Symphony',
                artists: [{ name: 'Royal Symphony Orchestra' }],
                album: { name: 'Cosmic Harmonies' },
                label: 'Universal Records',
                score: 98,
                external_ids: { isrc: 'USRC12345678', upc: '0123456789' },
              },
            ],
          },
        }),
      });
      global.fetch = mockFetch;

      const res = await service.identifyAudio(Buffer.from('test-audio-content'));

      expect(res.hasMatch).toBe(true);
      expect(res.isClean).toBe(false);
      expect(res.bestMatch).toBeDefined();
      expect(res.bestMatch?.title).toBe('Starlight Symphony');
      expect(res.bestMatch?.artist).toBe('Royal Symphony Orchestra');
      expect(res.bestMatch?.isrc).toBe('USRC12345678');
      expect(res.bestMatch?.score).toBe(98);
    });

    it('should return clean when ACRCloud returns code 1001 (no match)', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: { code: 1001, msg: 'No result' },
        }),
      });
      global.fetch = mockFetch;

      const res = await service.identifyAudio(Buffer.from('original-unregistered-audio'));

      expect(res.hasMatch).toBe(false);
      expect(res.isClean).toBe(true);
      expect(res.statusCode).toBe(1001);
    });

    it('should handle API errors properly', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: { code: 3001, msg: 'Signature Error' },
        }),
      });
      global.fetch = mockFetch;

      const res = await service.identifyAudio(Buffer.from('sample-bytes'));

      expect(res.hasMatch).toBe(false);
      expect(res.isClean).toBe(false);
      expect(res.error).toContain('ACRCloud Error (3001)');
    });
  });

  describe('scanTrack', () => {
    it('should update trackAudioScan with match details when match is found', async () => {
      const track = {
        id: 'track-1',
        code: 'TRK-000001',
        title: 'Original Song',
        audioKey: 'catalog/wl-1/audio/song.wav',
        audioScan: null,
      };

      mockPrisma.track.findUnique.mockResolvedValue(track);
      mockPrisma.trackAudioScan.create.mockResolvedValue({
        id: 'scan-1',
        trackId: 'track-1',
        status: AudioScanStatus.PENDING,
      });

      mockStorage.getFileBuffer.mockResolvedValue(Buffer.from('sample-audio-bytes'));

      jest.spyOn(service, 'identifyAudio').mockResolvedValue({
        statusCode: 0,
        statusMsg: 'Success',
        isClean: false,
        hasMatch: true,
        bestMatch: {
          title: 'Existing Hit',
          artist: 'Famous Artist',
          album: 'Famous Album',
          isrc: 'GBAYE1234567',
          label: 'Major Label',
          score: 100,
          externalIds: { isrc: 'GBAYE1234567' },
          raw: {},
        },
      });

      mockPrisma.trackAudioScan.update.mockResolvedValue({
        id: 'scan-1',
        trackId: 'track-1',
        status: AudioScanStatus.MATCH_FOUND,
        matchedTitle: 'Existing Hit',
        matchedArtist: 'Famous Artist',
        matchScore: 100,
      });

      const result = await service.scanTrack('track-1');

      expect(result).toBeDefined();
      expect(mockPrisma.trackAudioScan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: AudioScanStatus.MATCH_FOUND,
            matchedTitle: 'Existing Hit',
            matchedArtist: 'Famous Artist',
            matchScore: 100,
          }),
        }),
      );
    });

    it('should update trackAudioScan to CLEAN when no copyright match exists', async () => {
      const track = {
        id: 'track-2',
        code: 'TRK-000002',
        title: 'Indie Anthem',
        audioKey: 'catalog/wl-1/audio/indie.wav',
        audioScan: null,
      };

      mockPrisma.track.findUnique.mockResolvedValue(track);
      mockPrisma.trackAudioScan.create.mockResolvedValue({
        id: 'scan-2',
        trackId: 'track-2',
        status: AudioScanStatus.PENDING,
      });

      mockStorage.getFileBuffer.mockResolvedValue(Buffer.from('indie-audio-bytes'));

      jest.spyOn(service, 'identifyAudio').mockResolvedValue({
        statusCode: 1001,
        statusMsg: 'No result',
        isClean: true,
        hasMatch: false,
      });

      mockPrisma.trackAudioScan.update.mockResolvedValue({
        id: 'scan-2',
        trackId: 'track-2',
        status: AudioScanStatus.CLEAN,
      });

      const result = await service.scanTrack('track-2');

      expect(result).toBeDefined();
      expect(mockPrisma.trackAudioScan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: AudioScanStatus.CLEAN,
          }),
        }),
      );
    });
  });
});
