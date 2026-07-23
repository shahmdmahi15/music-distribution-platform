import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CurrentUserDto } from './dto/current-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async currentUser(dto: CurrentUserDto) {
    const token = crypto.createHash('sha256').update(dto.token).digest('hex');

    try {
      const session = await this.prismaService.session.findUnique({
        where: { token },
        include: { platformUser: true },
      });

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      if (session.revokedAt) {
        throw new UnauthorizedException(
          `Session has been revoked due to ${session.revokeReason}`,
        );
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

      const {
        id,
        firstName,
        lastName,
        email,
        twoFactorEnabled,
        role,
        lastLoginAt,
        createdAt,
        updatedAt,
      } = session.platformUser;

      return {
        id,
        firstName,
        lastName,
        email,
        twoFactorEnabled,
        role,
        lastLoginAt,
        createdAt,
        updatedAt,
      };
    } catch (error) {
      console.error('[UserService] Fetching Current User Failure', error);
      throw error;
    }
  }
}
