import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class WhitelabelSessionService {
  constructor(private readonly prismaService: PrismaService) {}

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.prismaService.session.findMany({
      where: {
        whiteLabelUserId: userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { accessedAt: 'desc' },
      select: {
        id: true,
        code: true,
        ipAddress: true,
        userAgent: true,
        accessedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: 'Active sessions retrieved successfully',
      sessions: sessions.map((s) => ({
        ...s,
        isCurrent: s.id === currentSessionId,
      })),
    };
  }

  async revokeSession(userId: string, sessionCode: string) {
    const session = await this.prismaService.session.findFirst({
      where: {
        code: sessionCode,
        whiteLabelUserId: userId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.revokedAt) {
      return {
        success: true,
        message: 'Session is already revoked',
      };
    }

    await this.prismaService.session.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
        revokeReason: 'USER_REVOCATION',
      },
    });

    return {
      success: true,
      message: 'Session revoked successfully',
    };
  }

  async revokeOtherSessions(userId: string, currentSessionId: string) {
    const result = await this.prismaService.session.updateMany({
      where: {
        whiteLabelUserId: userId,
        id: { not: currentSessionId },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: 'USER_REVOKED_OTHER_SESSIONS',
      },
    });

    return {
      success: true,
      message: `Successfully logged out of ${result.count} other session(s)`,
      revokedCount: result.count,
    };
  }
}
