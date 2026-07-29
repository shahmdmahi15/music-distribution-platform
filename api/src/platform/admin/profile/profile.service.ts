import { BadRequestException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { StorageService } from 'src/lib/storage/storage.service';
import { STORAGE_KEYS } from 'src/config/storage-keys.config';
import { ARGON2_CONFIG } from 'src/config/argon2.config';
import { UpdateProfileImageDto } from './dto/update-profile-image.dto';
import { UpdateProfileNameDto } from './dto/update-profile-name.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { OAuthAccountProvider } from 'src/generated/prisma/enums';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private getImageDimensions(
    buffer: Buffer,
  ): { width: number; height: number } | null {
    if (buffer.length < 24) return null;

    // PNG
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        if (
          marker >= 0xc0 &&
          marker <= 0xcf &&
          marker !== 0xc4 &&
          marker !== 0xc8 &&
          marker !== 0xcc
        ) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }

    // WebP
    if (
      buffer.length >= 30 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      const type = buffer.toString('ascii', 12, 16);
      if (type === 'VP8 ') {
        const width = buffer.readUInt16LE(26) & 0x3fff;
        const height = buffer.readUInt16LE(28) & 0x3fff;
        return { width, height };
      }
      if (type === 'VP8L') {
        const width = 1 + (buffer[21] | ((buffer[22] & 0x3f) << 8));
        const height =
          1 +
          (((buffer[22] & 0xc0) >> 6) |
            (buffer[23] << 2) |
            ((buffer[24] & 0x3) << 10));
        return { width, height };
      }
      if (type === 'VP8X') {
        const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
        const height =
          1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
        return { width, height };
      }
    }

    return null;
  }

  async updateProfileImage(userId: string, dto: UpdateProfileImageDto) {
    const match = dto.image.match(
      /^data:(image\/(jpeg|png|webp));base64,(.+)$/,
    );
    if (!match) throw new BadRequestException('Invalid image data');

    const [, mimeType, , base64Data] = match;

    const fileBuffer = Buffer.from(base64Data, 'base64');

    if (fileBuffer.length > STORAGE_KEYS.platform.users.profile.limit) {
      throw new BadRequestException('Image exceeds 1MB limit');
    }

    const dimensions = this.getImageDimensions(fileBuffer);
    if (dimensions && (dimensions.width !== 500 || dimensions.height !== 500)) {
      throw new BadRequestException(
        `Image resolution must be exactly 500x500px (Selected: ${dimensions.width}x${dimensions.height}px)`,
      );
    }

    const key = STORAGE_KEYS.platform.users.profile.key(userId);

    const imageKey = await this.storageService.uploadFileBuffer(
      key,
      fileBuffer,
      mimeType,
    );

    await this.prismaService.platformUser.update({
      where: { id: userId },
      data: {
        image: imageKey,
      },
      select: {
        id: true,
        image: true,
      },
    });

    return {
      success: true,
      message: 'Profile Image Updated Successfully',
    };
  }

  async removeProfileImage(userId: string) {
    const user = await this.prismaService.platformUser.findUnique({
      where: { id: userId },
      select: { image: true },
    });

    if (!user || !user.image) {
      throw new BadRequestException('No profile image found to delete');
    }

    await this.storageService.deleteFile(user.image);

    await this.prismaService.platformUser.update({
      where: { id: userId },
      data: {
        image: null,
      },
      select: {
        id: true,
        image: true,
      },
    });

    return {
      success: true,
      message: 'Profile Image Removed Successfully',
    };
  }

  async updateProfileName(userId: string, dto: UpdateProfileNameDto) {
    await this.prismaService.platformUser.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    return {
      success: true,
      message: 'Profile Name Updated Successfully',
    };
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prismaService.platformUser.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user || !user.passwordHash) {
      throw new BadRequestException('No password found to update');
    }

    const isCurrentPasswordValid = await argon2.verify(
      user.passwordHash,
      dto.currentPassword,
      ARGON2_CONFIG,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Invalid current password');
    }
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException(
        'New password cannot be the same as current password',
      );
    }
    const newPasswordHash = await argon2.hash(dto.newPassword, ARGON2_CONFIG);
    await this.prismaService.platformUser.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
      select: { id: true, passwordHash: true },
    });
    return {
      success: true,
      message: 'Password Updated Successfully',
    };
  }

  async getLinkedAccounts(userId: string) {
    const user = await this.prismaService.platformUser.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
        oAuthAccounts: { select: { provider: true } },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      success: true,
      message: 'Linked Accounts Fetched Successfully',
      linkedAccounts: {
        password: user.passwordHash !== null,
        google: user.oAuthAccounts.some(
          (account) => account.provider === OAuthAccountProvider.GOOGLE,
        ),
        github: user.oAuthAccounts.some(
          (account) => account.provider === OAuthAccountProvider.GITHUB,
        ),
      },
    };
  }
}
