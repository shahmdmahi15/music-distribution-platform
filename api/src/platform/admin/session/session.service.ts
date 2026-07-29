import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { RevokeSessionDto } from './dto/revoke-session.dto';

@Injectable()
export class SessionService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllSessions(userId: string) {
    const sessions = await this.prismaService.session.findMany({
      where: { platformUserId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        platformUserId: true,
        ipAddress: true,
        userAgent: true,
        revokeReason: true,
        accessedAt: true,
        revokedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: 'All sessions fetched successfully.',
      sessions: sessions,
    };
  }

  async revokeSession(userId: string, dto: RevokeSessionDto) {
    const revoked = await this.prismaService.session.update({
      where: { id: dto.sessionId, platformUserId: userId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokeReason: 'Revoked By User',
      },
    });

    if (!revoked.revokedAt) {
      throw new InternalServerErrorException('Failed to revoke session.');
    }

    return {
      success: true,
      message: 'Session revoked successfully.',
    };
  }

  async revokeAllOtherSessions(userId: string, currentSessionId: string) {
    await this.prismaService.session.updateMany({
      where: {
        id: { not: currentSessionId },
        platformUserId: userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: 'Revoked By User',
      },
    });

    return {
      success: true,
      message: 'Other sessions revoked successfully.',
    };
  }
}
