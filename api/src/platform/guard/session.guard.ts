import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PlatformUser, Session } from 'src/generated/prisma/client';
import * as crypto from 'crypto';
import { Request } from 'express';
import { PrismaService } from 'src/lib/prisma/prisma.service';

export interface AuthenticatedRequest extends Request {
  user: PlatformUser;
  session: Session;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authHeader = request.headers.authorization;
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

    request.user = session.platformUser;
    request.session = session;

    return true;
  }
}
