import { Controller, Get } from '@nestjs/common';
import { WhitelabelTenantService } from './whitelabel-tenant.service';
import { CurrentWhiteLabel } from '../decorator/current-whitelabel.decorator';
import type { WhiteLabel } from 'src/generated/prisma/client';

@Controller('tenant')
export class WhitelabelTenantController {
  constructor(private readonly tenantService: WhitelabelTenantService) {}

  @Get()
  async getBranding(@CurrentWhiteLabel() whiteLabel: WhiteLabel) {
    return await this.tenantService.getPublicBranding(whiteLabel);
  }
}

