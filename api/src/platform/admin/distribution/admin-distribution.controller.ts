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
import { AnsDispatchService } from './ans-dispatch.service';
import { AnsMusicClientService } from 'src/lib/ans-music/ans-music-client.service';
import { DdexGeneratorService } from 'src/lib/ddex/ddex-generator.service';
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
    private readonly ansDispatchService: AnsDispatchService,
    private readonly ansMusicClient: AnsMusicClientService,
    private readonly ddexGeneratorService: DdexGeneratorService,
  ) {}

  @Get('releases/:code/ddex-xml')
  @Roles(...ADMIN_ROLES)
  async getReleaseDdexXml(@Param('code') code: string) {
    const xml = await this.ddexGeneratorService.generateReleaseErnXml(code);
    return { success: true, code, ddexXml: xml };
  }

  @Post('releases/:code/ans-dispatch')
  @Roles(...ADMIN_ROLES)
  async dispatchReleaseToAns(@Param('code') code: string) {
    return await this.ansDispatchService.autoDispatchRelease(code);
  }

  @Post('releases/:code/ans-simulate')
  @Roles(...ADMIN_ROLES)
  async simulateAnsStatus(
    @Param('code') code: string,
    @Body() body: { status: string; reason?: string },
  ) {
    const dossier = await this.distributionService.getReleaseDossier(code);
    const upstreamId = dossier.upstreamReleaseId || dossier.code;
    return await this.ansMusicClient.simulateStatus(upstreamId, body.status, {
      reason: body.reason,
    });
  }

  @Get('channels')
  @Roles(...ADMIN_ROLES)
  async listVevoChannels() {
    return await this.distributionService.listVevoChannels();
  }

  @Post('channels/:code/ans-dispatch')
  @Roles(...ADMIN_ROLES)
  async dispatchChannelToAns(@Param('code') code: string) {
    return await this.ansDispatchService.autoDispatchVevoChannel(code);
  }

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
