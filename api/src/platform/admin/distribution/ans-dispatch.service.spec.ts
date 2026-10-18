import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AnsDispatchService } from './ans-dispatch.service';
import { AnsMusicClientService } from 'src/lib/ans-music/ans-music-client.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { StorageService } from 'src/lib/storage/storage.service';
import { QcStatus, ReleaseStatus } from 'src/generated/prisma/client';

describe('AnsDispatchService', () => {
  let service: AnsDispatchService;
  let prisma: PrismaService;
  let ansClient: AnsMusicClientService;
  let storage: StorageService;

  const mockReleaseId = 'rel_cuid_123456';
  const mockReleaseCode = 'REL-ROYAL-2026-001';

  const mockCleanRelease = {
    id: mockReleaseId,
    code: mockReleaseCode,
    title: 'Neon Horizon',
    type: 'SINGLE' as const,
    status: ReleaseStatus.SUBMITTED,
    qcStatus: QcStatus.PASSED,
    isLocked: false,
    genre: 'Electronic',
    subgenre: 'Chillwave',
    cLine: '2026 RoyalMotion',
    pLine: '2026 RoyalMotion',
    coverArtKey: 'whitelabel-1/covers/neon.jpg',
    coverArtUrl: 'https://storage.royalmotionit.com/covers/neon.jpg',
    whiteLabelId: 'wl_tenant_1',
    whiteLabel: {
      id: 'wl_tenant_1',
      code: 'WL-001',
      name: 'RoyalMotion Enterprise',
      awsAccessKeyId: 'AKIA_MOCK',
      awsSecretAccessKey: 'SECRET_MOCK',
      bucketName: 'wl-bucket-1',
    },
    tracks: [
      {
        id: 'trk_1',
        code: 'TRK-001',
        trackNumber: 1,
        discNumber: 1,
        title: 'Neon Horizon',
        durationSeconds: 210,
        explicit: false,
        audioKey: 'whitelabel-1/audio/neon.wav',
        audioUrl: 'https://storage.royalmotionit.com/audio/neon.wav',
        isrc: null,
        audioScan: {
          status: 'CLEAN',
          matchScore: 0,
        },
        contributors: [{ name: 'Neon Artist', role: 'PRIMARY_ARTIST' }],
      },
    ],
    contributors: [{ name: 'Neon Artist', role: 'PRIMARY_ARTIST' }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnsDispatchService,
        {
          provide: PrismaService,
          useValue: {
            release: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            track: {
              updateMany: jest.fn(),
            },
            vevoChannel: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: AnsMusicClientService,
          useValue: {
            createRelease: jest.fn(),
            requestChannel: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            getTenantPresignedUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnsDispatchService>(AnsDispatchService);
    prisma = module.get<PrismaService>(PrismaService);
    ansClient = module.get<AnsMusicClientService>(AnsMusicClientService);
    storage = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Zero-Touch Auto-Dispatch on Clean QC Release Submission', () => {
    it('should successfully dispatch release when QC passes and assets are clean', async () => {
      (prisma.release.findFirst as jest.Mock).mockResolvedValueOnce(
        mockCleanRelease,
      );
      (storage.getTenantPresignedUrl as jest.Mock)
        .mockResolvedValueOnce('https://presigned.s3.aws.com/cover.jpg')
        .mockResolvedValueOnce('https://presigned.s3.aws.com/track1.wav');

      const ansCreateResponse = {
        id: 'ans_rel_777',
        externalId: mockReleaseCode,
        status: 'SUBMITTED',
      };
      (ansClient.createRelease as jest.Mock).mockResolvedValueOnce(
        ansCreateResponse,
      );

      (prisma.release.update as jest.Mock).mockResolvedValueOnce({
        ...mockCleanRelease,
        status: ReleaseStatus.DISTRIBUTED,
        isLocked: true,
        distributedAt: new Date(),
      });

      const result = await service.autoDispatchRelease(mockReleaseCode);

      expect(prisma.release.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ id: mockReleaseCode }, { code: mockReleaseCode }],
        },
        include: expect.any(Object),
      });

      expect(ansClient.createRelease).toHaveBeenCalledTimes(1);
      const [dispatchPayload] = (ansClient.createRelease as jest.Mock).mock
        .calls[0];
      expect(dispatchPayload).toMatchObject({
        externalId: mockReleaseCode,
        title: mockCleanRelease.title,
        tracks: expect.arrayContaining([
          expect.objectContaining({
            trackNumber: 1,
            title: 'Neon Horizon',
          }),
        ]),
      });

      expect(prisma.release.update).toHaveBeenCalledWith({
        where: { id: mockReleaseId },
        data: expect.objectContaining({
          status: ReleaseStatus.APPROVED,
          isLocked: true,
          distributedAt: expect.any(Date),
        }),
      });

      expect(result).toMatchObject({
        success: true,
        releaseCode: mockReleaseCode,
        ansReleaseId: ansCreateResponse.id,
      });
    });

    it('should abort auto-dispatch and throw BadRequestException if release has blocking QC errors', async () => {
      const failedQcRelease = {
        ...mockCleanRelease,
        qcStatus: QcStatus.FAILED_BLOCKING,
        validationErrors: [
          { field: 'lyrics', message: 'Contains forbidden terms' },
        ],
      };
      (prisma.release.findFirst as jest.Mock).mockResolvedValueOnce(
        failedQcRelease,
      );

      await expect(
        service.autoDispatchRelease(mockReleaseCode),
      ).rejects.toThrow(BadRequestException);
      expect(ansClient.createRelease).not.toHaveBeenCalled();
      expect(prisma.release.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if release is already locked or already distributed', async () => {
      const alreadyLockedRelease = {
        ...mockCleanRelease,
        isLocked: true,
        status: ReleaseStatus.DISTRIBUTED,
      };
      (prisma.release.findFirst as jest.Mock).mockResolvedValueOnce(
        alreadyLockedRelease,
      );

      await expect(
        service.autoDispatchRelease(mockReleaseCode),
      ).rejects.toThrow(ConflictException);
      expect(ansClient.createRelease).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if release has 0 tracks', async () => {
      const emptyTracksRelease = {
        ...mockCleanRelease,
        tracks: [],
      };
      (prisma.release.findFirst as jest.Mock).mockResolvedValueOnce(
        emptyTracksRelease,
      );

      await expect(
        service.autoDispatchRelease(mockReleaseCode),
      ).rejects.toThrow(BadRequestException);
      expect(ansClient.createRelease).not.toHaveBeenCalled();
    });

    it('should handle ANS Music API failure gracefully without locking the release', async () => {
      (prisma.release.findFirst as jest.Mock).mockResolvedValueOnce(
        mockCleanRelease,
      );
      (storage.getTenantPresignedUrl as jest.Mock).mockResolvedValue(
        'https://presigned.s3.aws.com/asset',
      );
      (ansClient.createRelease as jest.Mock).mockRejectedValueOnce(
        new Error('Upstream ANS network timeout'),
      );

      await expect(
        service.autoDispatchRelease(mockReleaseCode),
      ).rejects.toThrow('Upstream ANS network timeout');

      expect(prisma.release.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ReleaseStatus.DISTRIBUTED }),
        }),
      );
    });
  });

  describe('VEVO Channel Auto-Dispatch', () => {
    const mockChannelId = 'vevo_cuid_99';
    const mockChannelCode = 'VEVO-CHAN-001';

    const mockChannelRecord = {
      id: mockChannelId,
      code: mockChannelCode,
      channelName: 'SufjanStevensVEVO',
      artistName: 'Sufjan Stevens',
      description: 'Official VEVO music channel for Sufjan Stevens',
      status: 'PENDING',
      isLocked: false,
    };

    it('should auto-dispatch valid VEVO channel request and update status to SUBMITTED', async () => {
      (prisma.vevoChannel.findFirst as jest.Mock).mockResolvedValueOnce(
        mockChannelRecord,
      );
      (ansClient.requestChannel as jest.Mock).mockResolvedValueOnce({
        id: 'ans_chan_req_501',
        externalId: mockChannelCode,
        status: 'PENDING',
      });
      (prisma.vevoChannel.update as jest.Mock).mockResolvedValueOnce({
        ...mockChannelRecord,
        status: 'SUBMITTED',
      });

      const result = await service.autoDispatchVevoChannel(mockChannelCode);

      expect(ansClient.requestChannel).toHaveBeenCalledWith({
        channelName: mockChannelRecord.channelName,
        artistName: mockChannelRecord.artistName,
        description: mockChannelRecord.description,
      });

      expect(prisma.vevoChannel.update).toHaveBeenCalledWith({
        where: { id: mockChannelId },
        data: expect.objectContaining({
          status: 'DISPATCHED_TO_ANS',
        }),
      });

      expect(result).toMatchObject({
        success: true,
        channelCode: mockChannelCode,
      });
    });

    it('should reject auto-dispatch if channel is already approved or submitted', async () => {
      (prisma.vevoChannel.findFirst as jest.Mock).mockResolvedValueOnce({
        ...mockChannelRecord,
        status: 'APPROVED',
      });

      await expect(
        service.autoDispatchVevoChannel(mockChannelCode),
      ).rejects.toThrow(ConflictException);
      expect(ansClient.requestChannel).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if channel record does not exist', async () => {
      (prisma.vevoChannel.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.autoDispatchVevoChannel('NON_EXISTENT'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
