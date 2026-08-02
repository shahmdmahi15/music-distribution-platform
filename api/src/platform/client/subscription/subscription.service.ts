import { Injectable } from '@nestjs/common';
import { PaymentStatus } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prismaService: PrismaService) {}

  async getCurrentSubscription(userId: string) {
    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: {
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

    return {
      success: true,
      message: 'Successfully fetched current subscription',
      subscription: subscription,
    };
  }
}
