import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { StorageService } from 'src/lib/storage/storage.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { WhiteLabelUser, Session } from 'src/generated/prisma/client';
import { WhiteLabelUserRole } from 'src/generated/prisma/enums';

export interface AuthenticatedWhitelabelSession {
  user: WhiteLabelUser;
  session: Session;
}

@Injectable()
export class WhitelabelSessionAuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async authenticate(
    authorizationHeader: string | undefined,
    tenantId?: string,
    allowedRoles?: WhiteLabelUserRole[],
  ): Promise<AuthenticatedWhitelabelSession> {
    if (!authorizationHeader) {
      throw new UnauthorizedException('Session token is missing');
    }

    const token = authorizationHeader.replace('Bearer ', '').trim();
    if (!token) {
      throw new UnauthorizedException('Invalid authorization token format');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const session = await this.prismaService.session.findUnique({
      where: { token: hashedToken },
      include: { whiteLabelUser: true },
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

    if (!session.whiteLabelUser) {
      throw new NotFoundException(
        'WhiteLabel user associated with this session was not found',
      );
    }

    const user = session.whiteLabelUser;

    // Multi-tenant boundary check: user must belong to the active WhiteLabel
    if (tenantId && user.whiteLabelId !== tenantId) {
      throw new ForbiddenException(
        'This session does not belong to the requested WhiteLabel portal',
      );
    }

    if (user.lockedUntil && new Date() < user.lockedUntil) {
      throw new ForbiddenException(
        `Account is locked until ${user.lockedUntil.toISOString()}`,
      );
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You are not permitted to access this resource',
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
