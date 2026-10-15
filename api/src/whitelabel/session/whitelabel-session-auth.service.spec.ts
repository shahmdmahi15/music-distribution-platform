import { Test, TestingModule } from '@nestjs/testing';
import {
  WhitelabelSessionAuthService,
} from './whitelabel-session-auth.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { StorageService } from 'src/lib/storage/storage.service';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { WhiteLabelUserRole } from 'src/generated/prisma/enums';

describe('WhitelabelSessionAuthService', () => {
  let service: WhitelabelSessionAuthService;
  let prismaMock: any;
  let storageMock: any;

  beforeEach(async () => {
    prismaMock = {
      session: {
        findUnique: jest.fn(),
      },
    };

    storageMock = {
      getFileUrl: jest.fn((key: string) => `https://cdn.example.com/${key}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhitelabelSessionAuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: StorageService, useValue: storageMock },
      ],
    }).compile();

    service = module.get<WhitelabelSessionAuthService>(
      WhitelabelSessionAuthService,
    );
  });

  it('should throw UnauthorizedException when authorizationHeader is missing', async () => {
    await expect(service.authenticate(undefined)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when token format is empty', async () => {
    await expect(service.authenticate('Bearer   ')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw NotFoundException when session does not exist', async () => {
    prismaMock.session.findUnique.mockResolvedValue(null);

    await expect(
      service.authenticate('Bearer valid-token-sample'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw UnauthorizedException when session is revoked', async () => {
    const rawToken = 'my-token';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    prismaMock.session.findUnique.mockResolvedValue({
      id: 'sess-1',
      token: hashedToken,
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 100000),
      whiteLabelUser: {
        id: 'user-1',
        whiteLabelId: 'tenant-a',
        role: WhiteLabelUserRole.CLIENT,
      },
    });

    await expect(service.authenticate(`Bearer ${rawToken}`)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when session has expired', async () => {
    const rawToken = 'my-token';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    prismaMock.session.findUnique.mockResolvedValue({
      id: 'sess-1',
      token: hashedToken,
      revokedAt: null,
      expiresAt: new Date(Date.now() - 10000), // expired in past
      whiteLabelUser: {
        id: 'user-1',
        whiteLabelId: 'tenant-a',
        role: WhiteLabelUserRole.CLIENT,
      },
    });

    await expect(service.authenticate(`Bearer ${rawToken}`)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw ForbiddenException on cross-tenant access violation', async () => {
    const rawToken = 'cross-tenant-token';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    prismaMock.session.findUnique.mockResolvedValue({
      id: 'sess-1',
      token: hashedToken,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 100000),
      whiteLabelUser: {
        id: 'user-from-tenant-a',
        whiteLabelId: 'tenant-a',
        role: WhiteLabelUserRole.CLIENT,
      },
    });

    // Attempting to access tenant-b with a session belonging to tenant-a
    await expect(
      service.authenticate(`Bearer ${rawToken}`, 'tenant-b'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if account is locked', async () => {
    const rawToken = 'locked-user-token';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    prismaMock.session.findUnique.mockResolvedValue({
      id: 'sess-1',
      token: hashedToken,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 100000),
      whiteLabelUser: {
        id: 'user-1',
        whiteLabelId: 'tenant-a',
        role: WhiteLabelUserRole.CLIENT,
        lockedUntil: new Date(Date.now() + 3600000),
      },
    });

    await expect(
      service.authenticate(`Bearer ${rawToken}`, 'tenant-a'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user role is not permitted', async () => {
    const rawToken = 'client-role-token';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    prismaMock.session.findUnique.mockResolvedValue({
      id: 'sess-1',
      token: hashedToken,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 100000),
      whiteLabelUser: {
        id: 'user-1',
        whiteLabelId: 'tenant-a',
        role: WhiteLabelUserRole.CLIENT,
      },
    });

    await expect(
      service.authenticate(`Bearer ${rawToken}`, 'tenant-a', [
        WhiteLabelUserRole.OWNER,
        WhiteLabelUserRole.ADMIN,
      ]),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should authenticate successfully with valid session and matching tenant', async () => {
    const rawToken = 'valid-token';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const mockUser = {
      id: 'user-1',
      email: 'artist@example.com',
      whiteLabelId: 'tenant-a',
      role: WhiteLabelUserRole.CLIENT,
      image: 'avatars/artist.png',
      lockedUntil: null,
    };

    const mockSession = {
      id: 'sess-1',
      token: hashedToken,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 100000),
      whiteLabelUser: mockUser,
    };

    prismaMock.session.findUnique.mockResolvedValue(mockSession);

    const result = await service.authenticate(`Bearer ${rawToken}`, 'tenant-a', [
      WhiteLabelUserRole.CLIENT,
    ]);

    expect(result).toBeDefined();
    expect(result.user.id).toBe('user-1');
    expect(result.user.image).toBe('https://cdn.example.com/avatars/artist.png');
    expect(result.session.id).toBe('sess-1');
  });
});
