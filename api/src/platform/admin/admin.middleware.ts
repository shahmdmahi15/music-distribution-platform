import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { StorageService } from 'src/lib/storage/storage.service';
import * as crypto from 'crypto';
import { PlatformUserRole } from 'src/generated/prisma/enums';
import { PlatformUser, Session } from 'src/generated/prisma/client';

export interface AuthenticatedRequest extends Request {
  user: PlatformUser;
  session: Session;
}

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Session token is missing');
    }

    const token = authHeader.replace('Bearer ', '').trim();
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

    if (
      session.platformUser.lockedUntil &&
      new Date() < session.platformUser.lockedUntil
    ) {
      throw new ForbiddenException(
        `Account is locked until ${session.platformUser.lockedUntil.toISOString()}`,
      );
    }

    const ADMIN_ROLES: PlatformUserRole[] = [
      PlatformUserRole.OWNER,
      PlatformUserRole.ADMIN,
      PlatformUserRole.MANAGER,
      PlatformUserRole.STAFF,
    ];

    if (!ADMIN_ROLES.includes(session.platformUser.role)) {
      throw new ForbiddenException(
        'You are not allowed to access these resource',
      );
    }

    let profileImage: string | null = null;

    if (session.platformUser.image) {
      try {
        profileImage = await this.storageService.getImageBase64(
          session.platformUser.image,
        );
      } catch (error) {
        console.error(
          '[AdminMiddleware] Failed to retrieve user profile image from storage:',
          error,
        );
      }
    }

    req.user = session.platformUser;
    req.user.image = profileImage;
    req.session = session;

    next();
  }
}
