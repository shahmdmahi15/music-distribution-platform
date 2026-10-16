import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  WhitelabelContractsService,
  ContractLevel,
  CreateContractDto,
} from './whitelabel-contracts.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';

describe('WhitelabelContractsService', () => {
  let service: WhitelabelContractsService;
  let prismaMock: {
    contract: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      contract: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhitelabelContractsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<WhitelabelContractsService>(
      WhitelabelContractsService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Contract Creation & Split Validation', () => {
    it('should throw BadRequestException when total split percentage is less than 100%', async () => {
      const invalidDto: CreateContractDto = {
        whiteLabelId: 'wl-tenant-1',
        name: 'Under-allocated Deal',
        level: ContractLevel.RELEASE,
        targetId: 'rel-123',
        splits: [
          { payeeId: 'payee-artist', percentage: 50 },
          { payeeId: 'payee-producer', percentage: 40 },
        ], // 90%
      };

      await expect(service.createContract(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.contract.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when total split percentage is greater than 100%', async () => {
      const invalidDto: CreateContractDto = {
        whiteLabelId: 'wl-tenant-1',
        name: 'Over-allocated Deal',
        level: ContractLevel.TRACK,
        targetId: 'trk-123',
        splits: [
          { payeeId: 'payee-1', percentage: 60 },
          { payeeId: 'payee-2', percentage: 50 },
        ], // 110%
      };

      await expect(service.createContract(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.contract.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when splits array is empty or contains non-positive values', async () => {
      const emptyDto: CreateContractDto = {
        whiteLabelId: 'wl-tenant-1',
        name: 'Empty Splits',
        level: ContractLevel.ACCOUNT,
        splits: [],
      };

      await expect(service.createContract(emptyDto)).rejects.toThrow(
        BadRequestException,
      );

      const negativeDto: CreateContractDto = {
        whiteLabelId: 'wl-tenant-1',
        name: 'Negative Splits',
        level: ContractLevel.ACCOUNT,
        splits: [
          { payeeId: 'payee-1', percentage: -10 },
          { payeeId: 'payee-2', percentage: 110 },
        ],
      };

      await expect(service.createContract(negativeDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create contract successfully when split percentage is exactly 100%', async () => {
      const validDto: CreateContractDto = {
        whiteLabelId: 'wl-tenant-1',
        name: 'Standard Master Split',
        level: ContractLevel.TRACK,
        targetId: 'trk-100',
        splits: [
          { payeeId: 'payee-artist', percentage: 60 },
          { payeeId: 'payee-label', percentage: 40 },
        ],
      };

      const mockCreated = {
        id: 'contract-created-1',
        ...validDto,
        createdAt: new Date(),
      };
      prismaMock.contract.create.mockResolvedValue(mockCreated);

      const result = await service.createContract(validDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('contract-created-1');
      expect(prismaMock.contract.create).toHaveBeenCalledTimes(1);
    });

    it('should create contract successfully with 3-way split summing to 100%', async () => {
      const threeWayDto: CreateContractDto = {
        whiteLabelId: 'wl-tenant-1',
        name: 'Trio Split',
        level: ContractLevel.RELEASE,
        targetId: 'rel-555',
        splits: [
          { payeeId: 'payee-1', percentage: 50 },
          { payeeId: 'payee-2', percentage: 25 },
          { payeeId: 'payee-3', percentage: 25 },
        ],
      };

      prismaMock.contract.create.mockResolvedValue({
        id: 'contract-3way',
        ...threeWayDto,
      });

      const result = await service.createContract(threeWayDto);
      expect(result).toBeDefined();
      expect(prismaMock.contract.create).toHaveBeenCalled();
    });
  });

  describe('Contract Hierarchy & Precedence Engine', () => {
    const trackContract = {
      id: 'contract-track',
      name: 'Track Level Contract',
      level: ContractLevel.TRACK,
      targetId: 'track-999',
      splits: [
        { payeeId: 'artist-payee', percentage: 70 },
        { payeeId: 'label-payee', percentage: 30 },
      ],
    };

    const releaseContract = {
      id: 'contract-release',
      name: 'Release Level Contract',
      level: ContractLevel.RELEASE,
      targetId: 'rel-888',
      splits: [
        { payeeId: 'artist-payee', percentage: 50 },
        { payeeId: 'label-payee', percentage: 50 },
      ],
    };

    const artistContract = {
      id: 'contract-artist',
      name: 'Artist Level Contract',
      level: ContractLevel.ARTIST,
      targetId: 'art-777',
      splits: [
        { payeeId: 'artist-payee', percentage: 80 },
        { payeeId: 'label-payee', percentage: 20 },
      ],
    };

    const accountContract = {
      id: 'contract-account',
      name: 'Account Default Contract',
      level: ContractLevel.ACCOUNT,
      whiteLabelId: 'wl-tenant-1',
      splits: [{ payeeId: 'label-payee', percentage: 100 }],
    };

    it('Precedence Check 1: Track contract overrides Release, Artist, and Account contract', async () => {
      // Mock returns contract for track
      prismaMock.contract.findFirst.mockImplementation(
        async ({ where }: any) => {
          if (
            where?.level === ContractLevel.TRACK &&
            (where?.targetId === 'track-999' ||
              where?.contractAssets?.some?.trackId === 'track-999')
          ) {
            return trackContract;
          }
          if (where?.level === ContractLevel.RELEASE) return releaseContract;
          if (where?.level === ContractLevel.ARTIST) return artistContract;
          if (where?.level === ContractLevel.ACCOUNT) return accountContract;
          return null;
        },
      );

      const resolved = await service.resolveEffectiveContract({
        whiteLabelId: 'wl-tenant-1',
        trackId: 'track-999',
        releaseId: 'rel-888',
        artistId: 'art-777',
      });

      expect(resolved).toBeDefined();
      expect(resolved?.id).toBe(trackContract.id);
      expect(resolved?.level).toBe(ContractLevel.TRACK);
    });

    it('Precedence Check 2: Release contract overrides Artist and Account contract when no Track contract exists', async () => {
      prismaMock.contract.findFirst.mockImplementation(
        async ({ where }: any) => {
          if (where?.level === ContractLevel.TRACK) return null; // No track contract
          if (
            where?.level === ContractLevel.RELEASE &&
            (where?.targetId === 'rel-888' ||
              where?.contractAssets?.some?.releaseId === 'rel-888')
          ) {
            return releaseContract;
          }
          if (where?.level === ContractLevel.ARTIST) return artistContract;
          if (where?.level === ContractLevel.ACCOUNT) return accountContract;
          return null;
        },
      );

      const resolved = await service.resolveEffectiveContract({
        whiteLabelId: 'wl-tenant-1',
        trackId: 'track-999',
        releaseId: 'rel-888',
        artistId: 'art-777',
      });

      expect(resolved).toBeDefined();
      expect(resolved?.id).toBe(releaseContract.id);
      expect(resolved?.level).toBe(ContractLevel.RELEASE);
    });

    it('Precedence Check 3: Artist contract overrides Account default contract when no Track or Release contract exists', async () => {
      prismaMock.contract.findFirst.mockImplementation(
        async ({ where }: any) => {
          if (where?.level === ContractLevel.TRACK) return null;
          if (where?.level === ContractLevel.RELEASE) return null;
          if (
            where?.level === ContractLevel.ARTIST &&
            (where?.targetId === 'art-777' ||
              where?.contractAssets?.some?.artistName === 'art-777')
          ) {
            return artistContract;
          }
          if (where?.level === ContractLevel.ACCOUNT) return accountContract;
          return null;
        },
      );

      const resolved = await service.resolveEffectiveContract({
        whiteLabelId: 'wl-tenant-1',
        trackId: 'track-999',
        releaseId: 'rel-888',
        artistId: 'art-777',
      });

      expect(resolved).toBeDefined();
      expect(resolved?.id).toBe(artistContract.id);
      expect(resolved?.level).toBe(ContractLevel.ARTIST);
    });

    it('Precedence Check 4: Falls back to Account default contract when no specific contract exists', async () => {
      prismaMock.contract.findFirst.mockImplementation(
        async ({ where }: any) => {
          if (where?.level === ContractLevel.TRACK) return null;
          if (where?.level === ContractLevel.RELEASE) return null;
          if (where?.level === ContractLevel.ARTIST) return null;
          if (where?.level === ContractLevel.ACCOUNT) return accountContract;
          return null;
        },
      );

      const resolved = await service.resolveEffectiveContract({
        whiteLabelId: 'wl-tenant-1',
        trackId: 'track-999',
        releaseId: 'rel-888',
      });

      expect(resolved).toBeDefined();
      expect(resolved?.id).toBe(accountContract.id);
      expect(resolved?.level).toBe(ContractLevel.ACCOUNT);
    });

    it('should throw NotFoundException when no contract exists at any level in the hierarchy', async () => {
      prismaMock.contract.findFirst.mockResolvedValue(null);

      await expect(
        service.resolveEffectiveContract({
          whiteLabelId: 'wl-tenant-1',
          trackId: 'track-orphan',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
