import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import * as crypto from 'crypto';
import { PlatformUserRole } from 'src/generated/prisma/enums';
import { PlatformUser, Session } from 'src/generated/prisma/client';

export interface AuthenticatedRequest extends Request {
  user: PlatformUser;
  session: Session;
}

@Injectable()
export class ClientMiddleware implements NestMiddleware {
  constructor(private readonly prismaService: PrismaService) {}

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

    const CLIENT_ROLES: PlatformUserRole[] = [PlatformUserRole.CLIENT];

    if (!CLIENT_ROLES.includes(session.platformUser.role)) {
      throw new ForbiddenException(
        'You are not allowed to access these resource',
      );
    }

    req.user = session.platformUser;
    req.session = session;

    next();
  }
}
