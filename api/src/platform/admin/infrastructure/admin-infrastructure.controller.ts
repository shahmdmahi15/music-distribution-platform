import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AdminInfrastructureService } from './admin-infrastructure.service';
import { InfrastructureActionDto } from './dto/infrastructure-action.dto';
import { Roles } from 'src/platform/decorator/roles.decorator';
import {
  ADMIN_ROLES,
  OWNER_ADMIN_ROLES,
} from 'src/platform/session/session-auth.service';
import type { AuthenticatedRequest } from 'src/platform/guard/session.guard';

@Controller('infrastructure')
export class AdminInfrastructureController {
  constructor(
    private readonly infrastructureService: AdminInfrastructureService,
  ) {}

  @Get('overview')
  @Roles(...ADMIN_ROLES)
  async getOverview() {
    return await this.infrastructureService.getOverview();
  }

  @Post('action')
  @Roles(...ADMIN_ROLES)
  async executeAction(
    @Body() dto: InfrastructureActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const operatorEmail = req.user?.email || 'admin@royalmotionit.com';
    return await this.infrastructureService.executeAction(dto, operatorEmail);
  }
}
