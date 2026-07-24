import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { StorageService } from 'src/lib/storage/storage.service';
import { STORAGE_KEYS } from 'src/config/storage-keys.config';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async uploadProfileImage(userId: string, image: string) {
    const match = image.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
    if (!match) throw new BadRequestException('Invalid image data');

    const [, mimeType, ext, base64Data] = match;

    const fileBuffer = Buffer.from(base64Data, 'base64');

    if (fileBuffer.length > STORAGE_KEYS.platform.users.profile.limit) {
      throw new BadRequestException('Image exceeds 5MB limit');
    }

    const key = STORAGE_KEYS.platform.users.profile.key(userId, ext);

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
    });

    return {
      success: true,
      message: 'Profile Image Uploaded Successfully',
    };
  }
}
