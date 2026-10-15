import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdminDistributionService } from './admin-distribution.service';
import { AdminDistributionQueryDto } from './dto/admin-distribution-query.dto';
import { UpdateReleaseStatusDto } from './dto/update-release-status.dto';
import { Roles } from 'src/platform/decorator/roles.decorator';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';
import { ADMIN_ROLES } from 'src/platform/session/session-auth.service';
import type { PlatformUser } from 'src/generated/prisma/client';

@Controller('distribution')
export class AdminDistributionController {
  constructor(
    private readonly distributionService: AdminDistributionService,
  ) {}

  @Get('releases')
  @Roles(...ADMIN_ROLES)
  async listReleases(@Query() query: AdminDistributionQueryDto) {
    return await this.distributionService.listReleases(query);
  }

  @Get('releases/:code')
  @Roles(...ADMIN_ROLES)
  async getReleaseDossier(@Param('code') code: string) {
    return await this.distributionService.getReleaseDossier(code);
  }

  @Patch('releases/:code/status')
  @Roles(...ADMIN_ROLES)
  async updateReleaseStatus(
    @Param('code') code: string,
    @Body() dto: UpdateReleaseStatusDto,
    @CurrentUser() adminUser: PlatformUser,
  ) {
    return await this.distributionService.updateReleaseStatus(
      code,
      dto,
      adminUser.id,
    );
  }

  @Get('releases/:code/export')
  @Roles(...ADMIN_ROLES)
  async exportRelease(@Param('code') code: string) {
    return await this.distributionService.exportReleaseMetadata(code);
  }

  @Get('tracks/:trackCode/download')
  @Roles(...ADMIN_ROLES)
  async getTrackDownloadUrl(@Param('trackCode') trackCode: string) {
    return await this.distributionService.getTrackDownloadUrl(trackCode);
  }

  @Post('tracks/:trackCode/scan')
  @Roles(...ADMIN_ROLES)
  async rescanTrack(@Param('trackCode') trackCode: string) {
    return await this.distributionService.rescanTrack(trackCode);
  }
}
