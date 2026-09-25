import { Body, Controller, Get, Post } from '@nestjs/common';
import { WhitelabelTenantService } from './whitelabel-tenant.service';
import { CurrentWhiteLabel } from '../decorator/current-whitelabel.decorator';
import type { WhiteLabel } from 'src/generated/prisma/client';
import { WhitelabelSetupDto } from './dto/whitelabel-setup.dto';

@Controller('tenant')
export class WhitelabelTenantController {
  constructor(private readonly tenantService: WhitelabelTenantService) {}

  @Get()
  async getBranding(@CurrentWhiteLabel() whiteLabel: WhiteLabel) {
    return await this.tenantService.getPublicBranding(whiteLabel);
  }

  @Post('setup')
  async completeSetup(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Body() dto: WhitelabelSetupDto,
  ) {
    return await this.tenantService.completeSetup(whiteLabel, dto);
  }
}
