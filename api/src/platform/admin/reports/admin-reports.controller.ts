import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AdminReportsService } from './admin-reports.service';
import { DspReportIngestionService } from './dsp-report-ingestion.service';
import { RoyaltyRunService } from './royalty-run.service';
import { CreateDistributionReportDto } from './dto/create-distribution-report.dto';
import { RequestReportUploadUrlDto } from './dto/request-report-upload-url.dto';
import { AdminReportsQueryDto } from './dto/admin-reports-query.dto';
import { DspIngestDto } from './dto/dsp-ingest.dto';
import { ExecuteRoyaltyRunDto } from './dto/execute-royalty-run.dto';
import { Roles } from 'src/platform/decorator/roles.decorator';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';
import { ADMIN_ROLES } from 'src/platform/session/session-auth.service';
import type { PlatformUser } from 'src/generated/prisma/client';

@Controller('reports')
export class AdminReportsController {
  constructor(
    private readonly reportsService: AdminReportsService,
    private readonly dspIngestionService: DspReportIngestionService,
    private readonly royaltyRunService: RoyaltyRunService,
  ) {}

  @Post('dsp-ingest')
  @Roles(...ADMIN_ROLES)
  async ingestDspReport(
    @Body() dto: DspIngestDto,
    @CurrentUser() adminUser: PlatformUser,
  ) {
    return await this.dspIngestionService.ingestDspReport({
      fileName: `dsp-${dto.store.toLowerCase()}-${dto.reportingPeriod}.csv`,
      fileContent: dto.fileContent || '',
      store: dto.store,
      reportingPeriod: dto.reportingPeriod,
      uploadedByPlatformUserId: adminUser.id,
    });
  }

  @Post('royalty-runs')
  @Roles(...ADMIN_ROLES)
  async executeRoyaltyRun(
    @Body() dto: ExecuteRoyaltyRunDto,
    @CurrentUser() adminUser: PlatformUser,
  ) {
    const period = (dto.period || dto.reportingPeriod || '').trim();
    const rate = dto.exchangeRateUsdToBdt || dto.exchangeRateBdtUsd || 120.0;
    return await this.royaltyRunService.executeRoyaltyRun(
      {
        reportingPeriod: period,
        exchangeRateUsdToBdt: rate,
        whiteLabelId: dto.whiteLabelId,
      },
      rate,
      adminUser.id,
    );
  }

  @Post('royalty-run')
  @Roles(...ADMIN_ROLES)
  async executeRoyaltyRunAlias(
    @Body() dto: ExecuteRoyaltyRunDto,
    @CurrentUser() adminUser: PlatformUser,
  ) {
    return await this.executeRoyaltyRun(dto, adminUser);
  }

  @Get('royalty-runs')
  @Roles(...ADMIN_ROLES)
  async listRoyaltyRuns(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('period') period?: string,
  ) {
    return await this.royaltyRunService.listRoyaltyRuns(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      period,
    );
  }

  @Post('upload-url')
  @Roles(...ADMIN_ROLES)
  async getUploadUrl(@Body() dto: RequestReportUploadUrlDto) {
    return await this.reportsService.getUploadUrl(dto);
  }

  @Post()
  @Roles(...ADMIN_ROLES)
  async createReport(
    @Body() dto: CreateDistributionReportDto,
    @CurrentUser() adminUser: PlatformUser,
  ) {
    return await this.reportsService.createReport(dto, adminUser.id);
  }

  @Get()
  @Roles(...ADMIN_ROLES)
  async listReports(@Query() query: AdminReportsQueryDto) {
    return await this.reportsService.listReports(query);
  }

  @Get(':code/download')
  @Roles(...ADMIN_ROLES)
  async getReportDownloadUrl(@Param('code') code: string) {
    return await this.reportsService.getReportDownloadUrl(code);
  }

  @Delete(':code')
  @Roles(...ADMIN_ROLES)
  async deleteReport(@Param('code') code: string) {
    return await this.reportsService.deleteReport(code);
  }
}
