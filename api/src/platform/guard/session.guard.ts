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
import { StorageService } from 'src/lib/storage/storage.service';

export interface AuthenticatedRequest extends Request {
  user: PlatformUser;
  session: Session;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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

    let profileImage: string | null = null;

    if (session.platformUser.image) {
      try {
        profileImage = await this.storageService.getImageBase64(
          session.platformUser.image,
        );
      } catch (error) {
        console.error(
          '[SessionGuard] Failed to retrieve user profile image from storage:',
          error,
        );
      }
    }

    request.user = session.platformUser;
    request.user.image = profileImage;
    request.session = session;

    return true;
  }
}
