import { Test, TestingModule } from '@nestjs/testing';
import { AdminDistributionService } from './admin-distribution.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { StorageService } from 'src/lib/storage/storage.service';
import { AcrCloudService } from 'src/lib/acrcloud/acrcloud.service';
import {
  createMockPrismaService,
  createMockStorageService,
  createMockAcrCloudService,
} from '../../../../test/mocks/mock-services';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReleaseStatus, ReleaseType } from 'src/generated/prisma/client';

describe('AdminDistributionService', () => {
  let service: AdminDistributionService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let storage: ReturnType<typeof createMockStorageService>;
  let acrcloud: ReturnType<typeof createMockAcrCloudService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    storage = createMockStorageService();
    acrcloud = createMockAcrCloudService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminDistributionService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
        { provide: AcrCloudService, useValue: acrcloud },
      ],
    }).compile();

    service = module.get<AdminDistributionService>(AdminDistributionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateReleaseStatus', () => {
    it('should throw BadRequestException if rejected without a rejection reason', async () => {
      (prisma as any).release.findUnique.mockResolvedValue({
        id: 'rel-1',
        code: 'RMIT-REL-0000001',
        status: ReleaseStatus.SUBMITTED,
      });

      await expect(
        service.updateReleaseStatus(
          'RMIT-REL-0000001',
          { status: ReleaseStatus.REJECTED },
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set distributedAt date when marked as DISTRIBUTED', async () => {
      (prisma as any).release.findUnique.mockResolvedValue({
        id: 'rel-1',
        code: 'RMIT-REL-0000001',
        status: ReleaseStatus.APPROVED,
        distributedAt: null,
      });

      (prisma as any).release.update.mockResolvedValue({
        id: 'rel-1',
        code: 'RMIT-REL-0000001',
        status: ReleaseStatus.DISTRIBUTED,
      });

      await service.updateReleaseStatus(
        'RMIT-REL-0000001',
        { status: ReleaseStatus.DISTRIBUTED },
        'admin-1',
      );

      expect((prisma as any).release.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ReleaseStatus.DISTRIBUTED,
            distributedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('exportReleaseMetadata', () => {
    it('should generate structured DSP ingestion manifest', async () => {
      (prisma as any).release.findUnique.mockResolvedValue({
        id: 'rel-1',
        code: 'RMIT-REL-0000001',
        title: 'Cyber Melody',
        type: ReleaseType.SINGLE,
        genre: 'Electronic',
        whiteLabel: { id: 'wl-1', code: 'RMIT-WL-001', name: 'Synth Records' },
        contributors: [{ name: 'DJ Pulse', role: 'PRIMARY_ARTIST' }],
        tracks: [
          {
            code: 'RMIT-TRK-0000001',
            trackNumber: 1,
            discNumber: 1,
            title: 'Track 1',
            isrc: 'US-XYZ-26-00001',
            audioKey: 'audio.wav',
            contributors: [],
          },
        ],
      });

      const manifest = await service.exportReleaseMetadata('RMIT-REL-0000001');
      expect(manifest.exportVersion).toBe('1.0.0');
      expect(manifest.release.title).toBe('Cyber Melody');
      expect(manifest.release.tracks).toHaveLength(1);
      expect(manifest.whiteLabel.name).toBe('Synth Records');
    });
  });
});
