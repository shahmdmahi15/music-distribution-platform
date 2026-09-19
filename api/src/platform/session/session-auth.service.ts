import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { StorageService } from 'src/lib/storage/storage.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { PlatformUser, Session } from 'src/generated/prisma/client';
import { PlatformUserRole } from 'src/generated/prisma/enums';

/**
 * Roles permitted to reach the `platform/admin/*` realm.
 *
 * This is only the coarse gate. Narrower per-handler requirements belong on the
 * handler itself via `@Roles(...)`.
 */
export const ADMIN_ROLES: PlatformUserRole[] = [
  PlatformUserRole.OWNER,
  PlatformUserRole.ADMIN,
  PlatformUserRole.MANAGER,
  PlatformUserRole.STAFF,
];

/** Roles permitted to reach the `platform/client/*` realm. */
export const CLIENT_ROLES: PlatformUserRole[] = [PlatformUserRole.CLIENT];

/**
 * Roles allowed to perform privileged mutations: user administration, payment
 * records, and WhiteLabel activation/suspension.
 */
export const OWNER_ADMIN_ROLES: PlatformUserRole[] = [
  PlatformUserRole.OWNER,
  PlatformUserRole.ADMIN,
];

/** Roles allowed to review and manage WhiteLabel applications. */
export const WHITELABEL_REVIEW_ROLES: PlatformUserRole[] = [
  PlatformUserRole.OWNER,
  PlatformUserRole.ADMIN,
  PlatformUserRole.MANAGER,
];

export interface AuthenticatedSession {
  user: PlatformUser;
  session: Session;
}

@Injectable()
export class SessionAuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Resolves a `Bearer <token>` authorization header to a live session and its
   * owning user.
   *
   * When `allowedRoles` is supplied the user's role must be a member, otherwise
   * any authenticated role is accepted. The returned user's `image` is a public
   * URL derived from the stored object key.
   */
  async authenticate(
    authorizationHeader: string | undefined,
    allowedRoles?: PlatformUserRole[],
  ): Promise<AuthenticatedSession> {
    if (!authorizationHeader) {
      throw new UnauthorizedException('Session token is missing');
    }

    const token = authorizationHeader.replace('Bearer ', '').trim();
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const session = await this.prismaService.session.findUnique({
      where: { token: hashedToken },
      include: { platformUser: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked');
    }

    if (session.expiresAt && new Date() > session.expiresAt) {
      throw new UnauthorizedException('Session has expired');
    }

    if (!session.platformUser) {
      throw new NotFoundException(
        'User associated with this session was not found',
      );
    }

    const user = session.platformUser;

    if (user.lockedUntil && new Date() < user.lockedUntil) {
      throw new ForbiddenException(
        `Account is locked until ${user.lockedUntil.toISOString()}`,
      );
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You are not allowed to access these resource',
      );
    }

    return {
      user: {
        ...user,
        image: user.image ? this.storageService.getFileUrl(user.image) : null,
      },
      session,
    };
  }
}
