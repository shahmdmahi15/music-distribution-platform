import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { StorageService } from 'src/lib/storage/storage.service';
import { ARGON2_CONFIG } from 'src/config/argon2.config';
import {
  generateUniqueCode,
  CodePrefix,
} from 'src/lib/prisma/code-generator';
import {
  WhiteLabelUser,
  WhiteLabelUserRole,
  Prisma,
} from 'src/generated/prisma/client';
import { CreateWhitelabelUserDto } from './dto/create-whitelabel-user.dto';
import { UpdateWhitelabelUserRoleDto } from './dto/update-whitelabel-user-role.dto';
import { QueryWhitelabelUsersDto } from './dto/query-whitelabel-users.dto';

@Injectable()
export class WhitelabelUsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async listUsers(tenantId: string, query: QueryWhitelabelUsersDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.WhiteLabelUserWhereInput = {
      whiteLabelId: tenantId,
      ...(query.role && { role: query.role }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { code: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prismaService.whiteLabelUser.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          code: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          image: true,
          twoFactorEnabled: true,
          lastLoginAt: true,
          lockedUntil: true,
          createdAt: true,
        },
      }),
      this.prismaService.whiteLabelUser.count({ where }),
    ]);

    return {
      success: true,
      message: 'Users fetched successfully',
      items: items.map((u) => ({
        ...u,
        image: u.image ? this.storageService.getFileUrl(u.image) : null,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getUser(tenantId: string, code: string) {
    const user = await this.prismaService.whiteLabelUser.findFirst({
      where: {
        code,
        whiteLabelId: tenantId,
      },
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        image: true,
        twoFactorEnabled: true,
        failedLoginAttempts: true,
        lastLoginAt: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in this portal');
    }

    return {
      success: true,
      message: 'User details retrieved successfully',
      user: {
        ...user,
        image: user.image ? this.storageService.getFileUrl(user.image) : null,
      },
    };
  }

  async createUser(
    tenantId: string,
    currentUser: WhiteLabelUser,
    dto: CreateWhitelabelUserDto,
  ) {
    // Only OWNER can create other OWNERs
    if (
      dto.role === WhiteLabelUserRole.OWNER &&
      currentUser.role !== WhiteLabelUserRole.OWNER
    ) {
      throw new ForbiddenException(
        'Only portal owners can assign the OWNER role.',
      );
    }

    const existing = await this.prismaService.whiteLabelUser.findUnique({
      where: {
        email_whiteLabelId: {
          email: dto.email,
          whiteLabelId: tenantId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'A user with this email already exists in this portal.',
      );
    }

    const passwordToHash =
      dto.password || crypto.randomBytes(8).toString('hex') + 'A1!';
    const passwordHash = await argon2.hash(passwordToHash, ARGON2_CONFIG);

    const userCode = await generateUniqueCode(
      this.prismaService,
      'whiteLabelUser',
      CodePrefix.WHITELABEL_USER,
    );

    const newUser = await this.prismaService.whiteLabelUser.create({
      data: {
        code: userCode,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        whiteLabelId: tenantId,
      },
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: 'User created successfully',
      user: newUser,
    };
  }

  async updateRole(
    tenantId: string,
    currentUser: WhiteLabelUser,
    code: string,
    dto: UpdateWhitelabelUserRoleDto,
  ) {
    const targetUser = await this.prismaService.whiteLabelUser.findFirst({
      where: { code, whiteLabelId: tenantId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Protection: do not allow demoting the only OWNER
    if (
      targetUser.role === WhiteLabelUserRole.OWNER &&
      dto.role !== WhiteLabelUserRole.OWNER
    ) {
      const ownerCount = await this.prismaService.whiteLabelUser.count({
        where: {
          whiteLabelId: tenantId,
          role: WhiteLabelUserRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot demote the sole OWNER of this WhiteLabel portal.',
        );
      }
    }

    // Only OWNER can promote someone to OWNER
    if (
      dto.role === WhiteLabelUserRole.OWNER &&
      currentUser.role !== WhiteLabelUserRole.OWNER
    ) {
      throw new ForbiddenException(
        'Only portal owners can assign the OWNER role.',
      );
    }

    const updated = await this.prismaService.whiteLabelUser.update({
      where: { id: targetUser.id },
      data: { role: dto.role },
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: `User role updated to ${dto.role} successfully`,
      user: updated,
    };
  }

  async toggleLock(
    tenantId: string,
    currentUser: WhiteLabelUser,
    code: string,
  ) {
    const targetUser = await this.prismaService.whiteLabelUser.findFirst({
      where: { code, whiteLabelId: tenantId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    if (targetUser.id === currentUser.id) {
      throw new BadRequestException('You cannot lock your own account.');
    }

    const isCurrentlyLocked =
      targetUser.lockedUntil && targetUser.lockedUntil > new Date();

    const newLockedUntil = isCurrentlyLocked
      ? null
      : new Date(Date.now() + 1000 * 60 * 60 * 24 * 365); // 1 year lock

    const updated = await this.prismaService.whiteLabelUser.update({
      where: { id: targetUser.id },
      data: {
        lockedUntil: newLockedUntil,
        failedLoginAttempts: 0,
      },
      select: {
        id: true,
        code: true,
        email: true,
        lockedUntil: true,
      },
    });

    // If locking account, revoke their active sessions immediately
    if (newLockedUntil) {
      await this.prismaService.session.updateMany({
        where: {
          whiteLabelUserId: targetUser.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokeReason: 'ACCOUNT_LOCKED_BY_ADMIN',
        },
      });
    }

    return {
      success: true,
      message: isCurrentlyLocked
        ? 'User account has been unlocked'
        : 'User account has been locked and active sessions revoked',
      user: updated,
    };
  }
}
