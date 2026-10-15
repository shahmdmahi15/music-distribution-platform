import { Module } from '@nestjs/common';
import { AnsWebhookController } from './ans-webhook.controller';
import { AnsWebhookService } from './ans-webhook.service';

@Module({
  controllers: [AnsWebhookController],
  providers: [AnsWebhookService],
  exports: [AnsWebhookService],
})
export class WebhooksModule {}
