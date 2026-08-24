import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { StorageService } from 'src/lib/storage/storage.service';
import { ARGON2_CONFIG } from 'src/config/argon2.config';
import {
  generateUniqueCode,
  CodePrefix,
} from 'src/lib/prisma/code-generator';
import { PlatformUserRole } from 'src/generated/prisma/enums';
import { PlatformUser, Prisma } from 'src/generated/prisma/client';
import {
  GetPlatformUsersDto,
  UserSortBy,
  UserStatusFilter,
  SortOrder,
} from './dto/get-platform-users.dto';
import { CreatePlatformUserDto } from './dto/create-platform-user.dto';
import { UpdatePlatformUserDto } from './dto/update-platform-user.dto';
import { LockPlatformUserDto } from './dto/lock-platform-user.dto';
import { ResetPasswordPlatformUserDto } from './dto/reset-password-platform-user.dto';
import {
  BulkActionPlatformUsersDto,
  BulkLockPlatformUsersDto,
  BulkRolePlatformUsersDto,
} from './dto/bulk-platform-users.dto';

@Injectable()
export class PlatformUsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getUsers(dto: GetPlatformUsersDto, actor: PlatformUser) {
    const page = Math.max(1, dto.page || 1);
    const limit = Math.min(100, Math.max(1, dto.limit || 10));
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.PlatformUserWhereInput = {};

    // Search query filter (matches code, firstName, lastName, email)
    if (dto.search?.trim()) {
      const term = dto.search.trim();
      where.OR = [
        { code: { contains: term, mode: 'insensitive' } },
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (dto.role) {
      where.role = dto.role;
    }

    // Status filter
    if (dto.status) {
      switch (dto.status) {
        case UserStatusFilter.ACTIVE:
          where.OR = [{ lockedUntil: null }, { lockedUntil: { lt: now } }];
          break;
        case UserStatusFilter.LOCKED:
          where.lockedUntil = { gte: now };
          break;
        case UserStatusFilter.VERIFIED:
          where.emailVerified = true;
          break;
        case UserStatusFilter.UNVERIFIED:
          where.emailVerified = false;
          break;
        case UserStatusFilter.TWO_FACTOR_ENABLED:
          where.twoFactorEnabled = true;
          break;
        case UserStatusFilter.TWO_FACTOR_DISABLED:
          where.twoFactorEnabled = false;
          break;
      }
    }

    // Sorting
    const sortByField = dto.sortBy || UserSortBy.CREATED_AT;
    const sortDirection = dto.sortOrder === SortOrder.ASC ? 'asc' : 'desc';
    const orderBy: Prisma.PlatformUserOrderByWithRelationInput = {
      [sortByField]: sortDirection,
    };

    // Execute paginated query and total count
    const [rawUsers, totalCount, statsData] = await Promise.all([
      this.prismaService.platformUser.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          code: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          image: true,
          emailVerified: true,
          twoFactorEnabled: true,
          failedLoginAttempts: true,
          failedVerificationAttempts: true,
          failedPasswordResetAttempts: true,
          failedTwoFactorAttempts: true,
          lastLoginAt: true,
          lockedUntil: true,
          createdAt: true,
          updatedAt: true,
          sessions: {
            where: {
              revokedAt: null,
              expiresAt: { gt: now },
            },
            select: { id: true },
          },
          oAuthAccounts: {
            select: { provider: true },
          },
          subscription: {
            select: {
              id: true,
              suspendedAt: true,
              whiteLabel: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prismaService.platformUser.count({ where }),
      this.getStatsData(now),
    ]);

    // Resolve images
    const usersWithImages = await Promise.all(
      rawUsers.map(async (u) => {
        let avatar: string | null = null;
        if (u.image) {
          try {
            avatar = await this.storageService.getImageBase64(u.image);
          } catch (e) {
            console.error(
              `[PlatformUsersService] Failed to load image for user ${u.id}:`,
              e,
            );
          }
        }

        const isLocked = u.lockedUntil ? new Date(u.lockedUntil) > now : false;

        return {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          role: u.role,
          image: avatar,
          emailVerified: u.emailVerified,
          twoFactorEnabled: u.twoFactorEnabled,
          failedLoginAttempts: u.failedLoginAttempts,
          failedVerificationAttempts: u.failedVerificationAttempts,
          failedPasswordResetAttempts: u.failedPasswordResetAttempts,
          failedTwoFactorAttempts: u.failedTwoFactorAttempts,
          lastLoginAt: u.lastLoginAt,
          lockedUntil: u.lockedUntil,
          isLocked,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          activeSessionCount: u.sessions.length,
          oauthProviders: u.oAuthAccounts.map((a) => a.provider),
          subscription: u.subscription,
        };
      }),
    );

    return {
      success: true,
      message: 'Platform users fetched successfully.',
      users: usersWithImages,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      stats: statsData,
    };
  }

  async getStats() {
    const statsData = await this.getStatsData(new Date());
    return {
      success: true,
      message: 'Platform user stats fetched successfully.',
      stats: statsData,
    };
  }

  private async getStatsData(now: Date) {
    const [
      totalUsers,
      lockedUsers,
      verifiedUsers,
      twoFactorUsers,
      ownerCount,
      adminCount,
      managerCount,
      staffCount,
      clientCount,
    ] = await Promise.all([
      this.prismaService.platformUser.count(),
      this.prismaService.platformUser.count({
        where: { lockedUntil: { gte: now } },
      }),
      this.prismaService.platformUser.count({
        where: { emailVerified: true },
      }),
      this.prismaService.platformUser.count({
        where: { twoFactorEnabled: true },
      }),
      this.prismaService.platformUser.count({
        where: { role: PlatformUserRole.OWNER },
      }),
      this.prismaService.platformUser.count({
        where: { role: PlatformUserRole.ADMIN },
      }),
      this.prismaService.platformUser.count({
        where: { role: PlatformUserRole.MANAGER },
      }),
      this.prismaService.platformUser.count({
        where: { role: PlatformUserRole.STAFF },
      }),
      this.prismaService.platformUser.count({
        where: { role: PlatformUserRole.CLIENT },
      }),
    ]);

    const activeUsers = Math.max(0, totalUsers - lockedUsers);

    return {
      totalUsers,
      activeUsers,
      lockedUsers,
      verifiedUsers,
      twoFactorUsers,
      roleCounts: {
        OWNER: ownerCount,
        ADMIN: adminCount,
        MANAGER: managerCount,
        STAFF: staffCount,
        CLIENT: clientCount,
      },
    };
  }

  async getUserById(id: string) {
    const now = new Date();
    const user = await this.prismaService.platformUser.findUnique({
      where: { id },
      include: {
        oAuthAccounts: {
          select: {
            id: true,
            code: true,
            provider: true,
            providerId: true,
            createdAt: true,
          },
        },
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            code: true,
            ipAddress: true,
            userAgent: true,
            accessedAt: true,
            expiresAt: true,
            revokedAt: true,
            revokeReason: true,
            createdAt: true,
          },
        },
        subscription: {
          include: {
            whiteLabel: {
              select: { id: true, code: true, name: true, createdAt: true },
            },
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Platform user not found.');
    }

    let avatar: string | null = null;
    if (user.image) {
      try {
        avatar = await this.storageService.getImageBase64(user.image);
      } catch (e) {
        console.error(
          `[PlatformUsersService] Failed to load image for user ${user.id}:`,
          e,
        );
      }
    }

    const isLocked = user.lockedUntil
      ? new Date(user.lockedUntil) > now
      : false;

    return {
      success: true,
      message: 'Platform user details fetched successfully.',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        image: avatar,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        failedLoginAttempts: user.failedLoginAttempts,
        failedVerificationAttempts: user.failedVerificationAttempts,
        failedPasswordResetAttempts: user.failedPasswordResetAttempts,
        failedTwoFactorAttempts: user.failedTwoFactorAttempts,
        lastLoginAt: user.lastLoginAt,
        lockedUntil: user.lockedUntil,
        isLocked,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        oAuthAccounts: user.oAuthAccounts,
        sessions: user.sessions,
        subscription: user.subscription,
      },
    };
  }

  async createUser(dto: CreatePlatformUserDto, actor: PlatformUser) {
    const existing = await this.prismaService.platformUser.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    // Role validation: Only OWNER can create OWNER
    if (
      dto.role === PlatformUserRole.OWNER &&
      actor.role !== PlatformUserRole.OWNER
    ) {
      throw new ForbiddenException('Only an OWNER can create another OWNER.');
    }

    const hashedPassword = await argon2.hash(dto.password, ARGON2_CONFIG);

    const code = await generateUniqueCode(
      this.prismaService,
      'platformUser',
      CodePrefix.PLATFORM_USER,
    );

    const newUser = await this.prismaService.platformUser.create({
      data: {
        code,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        passwordHash: hashedPassword,
        role: dto.role,
        emailVerified: dto.emailVerified ?? true,
        twoFactorEnabled: dto.twoFactorEnabled ?? false,
      },
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: `Platform user ${newUser.firstName} ${newUser.lastName} created successfully.`,
      user: newUser,
    };
  }

  async updateUser(
    id: string,
    dto: UpdatePlatformUserDto,
    actor: PlatformUser,
  ) {
    const targetUser = await this.prismaService.platformUser.findUnique({
      where: { id },
    });

    if (!targetUser) {
      throw new NotFoundException('Platform user not found.');
    }

    // Email collision check
    if (dto.email && dto.email !== targetUser.email) {
      const emailInUse = await this.prismaService.platformUser.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });
      if (emailInUse) {
        throw new ConflictException('A user with this email already exists.');
      }
    }

    // Role change safeguards
    if (dto.role && dto.role !== targetUser.role) {
      if (targetUser.role === PlatformUserRole.OWNER) {
        if (actor.role !== PlatformUserRole.OWNER) {
          throw new ForbiddenException(
            'Only an OWNER can modify the role of another OWNER.',
          );
        }

        // Check if last owner
        const totalOwners = await this.prismaService.platformUser.count({
          where: { role: PlatformUserRole.OWNER },
        });
        if (totalOwners <= 1) {
          throw new BadRequestException(
            'Cannot change the role of the only remaining OWNER on the platform.',
          );
        }
      }

      if (
        dto.role === PlatformUserRole.OWNER &&
        actor.role !== PlatformUserRole.OWNER
      ) {
        throw new ForbiddenException(
          'Only an OWNER can promote a user to OWNER role.',
        );
      }
    }

    const updatedUser = await this.prismaService.platformUser.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.emailVerified !== undefined && {
          emailVerified: dto.emailVerified,
        }),
        ...(dto.twoFactorEnabled !== undefined && {
          twoFactorEnabled: dto.twoFactorEnabled,
        }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        emailVerified: true,
        twoFactorEnabled: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: 'Platform user updated successfully.',
      user: updatedUser,
    };
  }

  async lockUser(id: string, dto: LockPlatformUserDto, actor: PlatformUser) {
    const targetUser = await this.prismaService.platformUser.findUnique({
      where: { id },
    });

    if (!targetUser) {
      throw new NotFoundException('Platform user not found.');
    }

    if (id === actor.id) {
      throw new BadRequestException('You cannot lock your own account.');
    }

    if (
      targetUser.role === PlatformUserRole.OWNER &&
      actor.role !== PlatformUserRole.OWNER
    ) {
      throw new ForbiddenException('Only an OWNER can lock another OWNER.');
    }

    if (dto.locked) {
      // Calculate lockedUntil
      const lockDate = dto.lockMinutes
        ? new Date(Date.now() + dto.lockMinutes * 60 * 1000)
        : new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years

      await this.prismaService.$transaction([
        this.prismaService.platformUser.update({
          where: { id },
          data: { lockedUntil: lockDate },
        }),
        this.prismaService.session.updateMany({
          where: { platformUserId: id, revokedAt: null },
          data: {
            revokedAt: new Date(),
            revokeReason: 'Account Locked by Admin',
          },
        }),
      ]);

      return {
        success: true,
        message: `User account has been locked${dto.lockMinutes ? ` for ${dto.lockMinutes} minutes` : ' indefinitely'}.`,
        lockedUntil: lockDate,
      };
    } else {
      // Unlock and reset failed attempts
      await this.prismaService.platformUser.update({
        where: { id },
        data: {
          lockedUntil: null,
          failedLoginAttempts: 0,
          failedVerificationAttempts: 0,
          failedPasswordResetAttempts: 0,
          failedTwoFactorAttempts: 0,
        },
      });

      return {
        success: true,
        message: 'User account has been unlocked and security counters reset.',
        lockedUntil: null,
      };
    }
  }

  async resetPassword(
    id: string,
    dto: ResetPasswordPlatformUserDto,
    actor: PlatformUser,
  ) {
    const targetUser = await this.prismaService.platformUser.findUnique({
      where: { id },
    });

    if (!targetUser) {
      throw new NotFoundException('Platform user not found.');
    }

    if (
      targetUser.role === PlatformUserRole.OWNER &&
      actor.role !== PlatformUserRole.OWNER
    ) {
      throw new ForbiddenException(
        "Only an OWNER can reset another OWNER's password.",
      );
    }

    const hashedPassword = await argon2.hash(dto.newPassword, ARGON2_CONFIG);

    await this.prismaService.$transaction([
      this.prismaService.platformUser.update({
        where: { id },
        data: {
          passwordHash: hashedPassword,
          failedPasswordResetAttempts: 0,
          failedLoginAttempts: 0,
        },
      }),
      this.prismaService.session.updateMany({
        where: { platformUserId: id, revokedAt: null },
        data: {
          revokedAt: new Date(),
          revokeReason: 'Password Reset by Admin',
        },
      }),
    ]);

    return {
      success: true,
      message: 'Password reset successfully and active sessions invalidated.',
    };
  }

  async resetAttempts(id: string) {
    const targetUser = await this.prismaService.platformUser.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Platform user not found.');
    }

    await this.prismaService.platformUser.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        failedVerificationAttempts: 0,
        failedPasswordResetAttempts: 0,
        failedTwoFactorAttempts: 0,
      },
    });

    return {
      success: true,
      message: 'Security counters reset successfully.',
    };
  }

  async revokeSessions(id: string, actor: PlatformUser) {
    const targetUser = await this.prismaService.platformUser.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Platform user not found.');
    }

    const res = await this.prismaService.session.updateMany({
      where: { platformUserId: id, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokeReason: `Revoked by Admin (${actor.firstName} ${actor.lastName})`,
      },
    });

    return {
      success: true,
      message: `${res.count} active session(s) revoked successfully.`,
      revokedCount: res.count,
    };
  }

  async deleteUser(id: string, actor: PlatformUser) {
    const targetUser = await this.prismaService.platformUser.findUnique({
      where: { id },
    });

    if (!targetUser) {
      throw new NotFoundException('Platform user not found.');
    }

    if (id === actor.id) {
      throw new BadRequestException(
        'You cannot delete your own account from the platform management dashboard.',
      );
    }

    if (targetUser.role === PlatformUserRole.OWNER) {
      if (actor.role !== PlatformUserRole.OWNER) {
        throw new ForbiddenException('Only an OWNER can delete another OWNER.');
      }

      const totalOwners = await this.prismaService.platformUser.count({
        where: { role: PlatformUserRole.OWNER },
      });

      if (totalOwners <= 1) {
        throw new BadRequestException(
          'Cannot delete the sole OWNER account of the platform.',
        );
      }
    }

    // Delete user from DB (Cascades sessions, oauth, subscriptions via Prisma schema)
    await this.prismaService.platformUser.delete({
      where: { id },
    });

    // Attempt image cleanup in storage if exists
    if (targetUser.image) {
      try {
        await this.storageService.deleteFile(targetUser.image);
      } catch (e) {
        console.error(
          `[PlatformUsersService] Could not remove storage image ${targetUser.image}:`,
          e,
        );
      }
    }

    return {
      success: true,
      message: `Platform user ${targetUser.firstName} ${targetUser.lastName} deleted successfully.`,
    };
  }

  async bulkLockUsers(dto: BulkLockPlatformUsersDto, actor: PlatformUser) {
    let targetIds = dto.userIds.filter((id) => id !== actor.id);

    if (targetIds.length === 0) {
      throw new BadRequestException(
        'No valid target users selected (you cannot lock your own account).',
      );
    }

    if (actor.role !== PlatformUserRole.OWNER) {
      // Exclude owners from non-owner actor
      const nonOwnerUsers = await this.prismaService.platformUser.findMany({
        where: {
          id: { in: targetIds },
          role: { not: PlatformUserRole.OWNER },
        },
        select: { id: true },
      });
      targetIds = nonOwnerUsers.map((u) => u.id);
    }

    if (targetIds.length === 0) {
      throw new ForbiddenException(
        'You do not have permission to lock the selected user accounts.',
      );
    }

    if (dto.locked) {
      const lockDate = dto.lockMinutes
        ? new Date(Date.now() + dto.lockMinutes * 60 * 1000)
        : new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);

      await this.prismaService.$transaction([
        this.prismaService.platformUser.updateMany({
          where: { id: { in: targetIds } },
          data: { lockedUntil: lockDate },
        }),
        this.prismaService.session.updateMany({
          where: { platformUserId: { in: targetIds }, revokedAt: null },
          data: {
            revokedAt: new Date(),
            revokeReason: 'Bulk Account Lock by Admin',
          },
        }),
      ]);

      return {
        success: true,
        message: `Successfully locked ${targetIds.length} user account(s).`,
        affectedCount: targetIds.length,
      };
    } else {
      await this.prismaService.platformUser.updateMany({
        where: { id: { in: targetIds } },
        data: {
          lockedUntil: null,
          failedLoginAttempts: 0,
          failedVerificationAttempts: 0,
          failedPasswordResetAttempts: 0,
          failedTwoFactorAttempts: 0,
        },
      });

      return {
        success: true,
        message: `Successfully unlocked ${targetIds.length} user account(s) and reset security counters.`,
        affectedCount: targetIds.length,
      };
    }
  }

  async bulkChangeRole(dto: BulkRolePlatformUsersDto, actor: PlatformUser) {
    if (
      dto.role === PlatformUserRole.OWNER &&
      actor.role !== PlatformUserRole.OWNER
    ) {
      throw new ForbiddenException('Only an OWNER can assign the OWNER role.');
    }

    let targetIds = dto.userIds.filter((id) => id !== actor.id);

    if (actor.role !== PlatformUserRole.OWNER) {
      const nonOwners = await this.prismaService.platformUser.findMany({
        where: {
          id: { in: targetIds },
          role: { not: PlatformUserRole.OWNER },
        },
        select: { id: true },
      });
      targetIds = nonOwners.map((u) => u.id);
    }

    if (targetIds.length === 0) {
      throw new BadRequestException('No eligible users found for role update.');
    }

    const res = await this.prismaService.platformUser.updateMany({
      where: { id: { in: targetIds } },
      data: { role: dto.role },
    });

    return {
      success: true,
      message: `Successfully updated role to ${dto.role} for ${res.count} user(s).`,
      affectedCount: res.count,
    };
  }

  async bulkRevokeSessions(
    dto: BulkActionPlatformUsersDto,
    actor: PlatformUser,
  ) {
    const res = await this.prismaService.session.updateMany({
      where: { platformUserId: { in: dto.userIds }, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokeReason: `Bulk Revoked by Admin (${actor.firstName} ${actor.lastName})`,
      },
    });

    return {
      success: true,
      message: `Revoked ${res.count} active session(s) across ${dto.userIds.length} user(s).`,
      affectedCount: res.count,
    };
  }

  async bulkDeleteUsers(dto: BulkActionPlatformUsersDto, actor: PlatformUser) {
    let targetIds = dto.userIds.filter((id) => id !== actor.id);

    if (actor.role !== PlatformUserRole.OWNER) {
      const nonOwners = await this.prismaService.platformUser.findMany({
        where: {
          id: { in: targetIds },
          role: { not: PlatformUserRole.OWNER },
        },
        select: { id: true },
      });
      targetIds = nonOwners.map((u) => u.id);
    } else {
      // Check if trying to delete all owners
      const ownersInSelection = await this.prismaService.platformUser.count({
        where: { id: { in: targetIds }, role: PlatformUserRole.OWNER },
      });
      const totalOwners = await this.prismaService.platformUser.count({
        where: { role: PlatformUserRole.OWNER },
      });

      if (ownersInSelection >= totalOwners) {
        throw new BadRequestException(
          'Cannot delete all platform owners. At least one owner must remain.',
        );
      }
    }

    if (targetIds.length === 0) {
      throw new BadRequestException('No eligible users found for deletion.');
    }

    const res = await this.prismaService.platformUser.deleteMany({
      where: { id: { in: targetIds } },
    });

    return {
      success: true,
      message: `Successfully deleted ${res.count} platform user(s).`,
      affectedCount: res.count,
    };
  }
}
