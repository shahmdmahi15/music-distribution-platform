import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { WhitelabelReportsService } from './whitelabel-reports.service';
import { WhitelabelSessionGuard } from '../guard/whitelabel-session.guard';
import { CurrentWhiteLabel } from '../decorator/current-whitelabel.decorator';
import type { WhiteLabel } from 'src/generated/prisma/client';

@Controller('reports')
@UseGuards(WhitelabelSessionGuard)
export class WhitelabelReportsController {
  constructor(private readonly reportsService: WhitelabelReportsService) {}

  @Get()
  async getReports(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Query('period') period?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.reportsService.getReports(whiteLabel.id, {
      period,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('summary')
  async getSummary(@CurrentWhiteLabel() whiteLabel: WhiteLabel) {
    return await this.reportsService.getSummaryMetrics(whiteLabel.id);
  }

  @Get(':code/download')
  async getDownloadUrl(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('code') code: string,
  ) {
    return await this.reportsService.getReportDownloadUrl(whiteLabel.id, code);
  }
}
