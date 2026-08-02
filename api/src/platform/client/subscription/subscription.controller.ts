import { Controller, Get } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('current')
  async getCurrentSubscription(@CurrentUser('id') id: string) {
    return await this.subscriptionService.getCurrentSubscription(id);
  }
}
