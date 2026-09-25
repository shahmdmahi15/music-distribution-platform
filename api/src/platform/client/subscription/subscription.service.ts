import { Injectable } from '@nestjs/common';
import { PaymentStatus } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { StorageService } from 'src/lib/storage/storage.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getCurrentSubscription(userId: string) {
    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: {
          whiteLabel: {
            include: {
              artists: {
                orderBy: {
                  orderIndex: 'asc',
                },
              },
              documents: {
                orderBy: {
                  createdAt: 'desc',
                },
              },
            },
          },
          payments: {
            where: {
              status: PaymentStatus.COMPLETED,
            },
            orderBy: {
              endsAt: 'desc',
            },
            take: 1,
          },
        },
      });

    if (subscription?.whiteLabel?.documents) {
      const docsWithUrls = await Promise.all(
        subscription.whiteLabel.documents.map(async (doc) => ({
          ...doc,
          fileUrl: doc.fileKey
            ? await this.storageService.getPresignedUrl(doc.fileKey, 3600 * 24)
            : null,
        })),
      );
      (subscription.whiteLabel as any).documents = docsWithUrls;
    }

    return {
      success: true,
      message: 'Successfully fetched current subscription',
      subscription: subscription,
    };
  }
}
