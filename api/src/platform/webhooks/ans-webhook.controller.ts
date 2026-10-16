import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AnsWebhookService } from './ans-webhook.service';

@Controller('webhooks')
export class AnsWebhookController {
  constructor(private readonly webhookService: AnsWebhookService) {}

  @Post('ans-music')
  @HttpCode(HttpStatus.OK)
  async handleAnsWebhook(
    @Req() req: Request,
    @Headers('x-ans-signature') xAnsSignature?: string,
    @Headers('x-ans-timestamp') xAnsTimestamp?: string,
    @Headers('signature') genericSignature?: string,
  ) {
    const signatureHeader = xAnsSignature || genericSignature;
    const rawBody =
      (req as any).rawBody ||
      (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    return this.webhookService.handleWebhook({
      signatureHeader,
      timestampHeader: xAnsTimestamp,
      rawBody,
    });
  }
}
