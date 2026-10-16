import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { WhitelabelReportsService } from './whitelabel-reports.service';
import { RoyaltyRunService } from 'src/platform/admin/reports/royalty-run.service';
import { WhitelabelSessionGuard } from '../guard/whitelabel-session.guard';
import { CurrentWhiteLabel } from '../decorator/current-whitelabel.decorator';
import type { WhiteLabel } from 'src/generated/prisma/client';

@Controller('reports')
@UseGuards(WhitelabelSessionGuard)
export class WhitelabelReportsController {
  constructor(
    private readonly reportsService: WhitelabelReportsService,
    private readonly royaltyRunService: RoyaltyRunService,
  ) {}

  @Get('statements')
  async getStatements(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Query('period') period?: string,
    @Query('payeeId') payeeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.royaltyRunService.getWhiteLabelStatements(
      whiteLabel.id,
      payeeId,
      period,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('statements/:code')
  async getStatementByCode(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('code') code: string,
  ) {
    return await this.royaltyRunService.getStatementByCode(whiteLabel.id, code);
  }

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
