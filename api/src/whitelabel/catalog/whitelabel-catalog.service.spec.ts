import { Test, TestingModule } from '@nestjs/testing';
import { WhitelabelCatalogService } from './whitelabel-catalog.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { StorageService } from 'src/lib/storage/storage.service';
import { AcrCloudService } from 'src/lib/acrcloud/acrcloud.service';
import {
  createMockPrismaService,
  createMockStorageService,
  createMockAcrCloudService,
} from '../../../test/mocks/mock-services';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReleaseStatus, ReleaseType } from 'src/generated/prisma/client';

describe('WhitelabelCatalogService', () => {
  let service: WhitelabelCatalogService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let storage: ReturnType<typeof createMockStorageService>;
  let acrcloud: ReturnType<typeof createMockAcrCloudService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    storage = createMockStorageService();
    acrcloud = createMockAcrCloudService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhitelabelCatalogService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
        { provide: AcrCloudService, useValue: acrcloud },
      ],
    }).compile();

    service = module.get<WhitelabelCatalogService>(WhitelabelCatalogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReleaseDraft', () => {
    it('should generate a code and create a draft release in database', async () => {
      const mockCreatedRelease = {
        id: 'rel-1',
        code: 'RMIT-REL-0000001',
        title: 'New Track',
        type: ReleaseType.SINGLE,
        status: ReleaseStatus.DRAFT,
      };

      (prisma as any).$queryRaw = jest
        .fn()
        .mockResolvedValue([{ nextval: BigInt(1) }]);
      (prisma as any).release.create.mockResolvedValue(mockCreatedRelease);

      const result = await service.createReleaseDraft('wl-1', 'user-1', {
        title: 'New Track',
        type: ReleaseType.SINGLE,
        genre: 'Pop',
      });

      expect(result).toEqual(mockCreatedRelease);
      expect((prisma as any).release.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Track',
            status: ReleaseStatus.DRAFT,
            whiteLabelId: 'wl-1',
          }),
        }),
      );
    });
  });

  describe('submitRelease', () => {
    it('should throw BadRequestException if release has no tracks', async () => {
      (prisma as any).release.findFirst.mockResolvedValue({
        id: 'rel-1',
        code: 'RMIT-REL-0000001',
        status: ReleaseStatus.DRAFT,
        tracks: [],
        coverArtKey: 'art.jpg',
      });

      await expect(
        service.submitRelease('wl-1', 'RMIT-REL-0000001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if release has no cover art', async () => {
      (prisma as any).release.findFirst.mockResolvedValue({
        id: 'rel-1',
        code: 'RMIT-REL-0000001',
        status: ReleaseStatus.DRAFT,
        tracks: [{ id: 't-1', audioKey: 'audio.wav' }],
        coverArtKey: null,
      });

      await expect(
        service.submitRelease('wl-1', 'RMIT-REL-0000001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if any track is missing lossless audio', async () => {
      (prisma as any).release.findFirst.mockResolvedValue({
        id: 'rel-1',
        code: 'RMIT-REL-0000001',
        status: ReleaseStatus.DRAFT,
        tracks: [{ id: 't-1', audioKey: null }],
        coverArtKey: 'art.jpg',
      });

      await expect(
        service.submitRelease('wl-1', 'RMIT-REL-0000001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully update status to SUBMITTED when quality checks pass', async () => {
      (prisma as any).release.findFirst.mockResolvedValue({
        id: 'rel-1',
        code: 'RMIT-REL-0000001',
        status: ReleaseStatus.DRAFT,
        tracks: [{ id: 't-1', audioKey: 'audio.wav' }],
        coverArtKey: 'art.jpg',
      });

      (prisma as any).release.update.mockResolvedValue({
        id: 'rel-1',
        code: 'RMIT-REL-0000001',
        status: ReleaseStatus.SUBMITTED,
      });

      const res = await service.submitRelease('wl-1', 'RMIT-REL-0000001');
      expect(res.success).toBe(true);
      expect((prisma as any).release.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ReleaseStatus.SUBMITTED,
          }),
        }),
      );
    });
  });
});
