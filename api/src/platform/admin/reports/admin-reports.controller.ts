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
import { CreateDistributionReportDto } from './dto/create-distribution-report.dto';
import { RequestReportUploadUrlDto } from './dto/request-report-upload-url.dto';
import { AdminReportsQueryDto } from './dto/admin-reports-query.dto';
import { Roles } from 'src/platform/decorator/roles.decorator';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';
import { ADMIN_ROLES } from 'src/platform/session/session-auth.service';
import type { PlatformUser } from 'src/generated/prisma/client';

@Controller('reports')
export class AdminReportsController {
  constructor(private readonly reportsService: AdminReportsService) {}

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
