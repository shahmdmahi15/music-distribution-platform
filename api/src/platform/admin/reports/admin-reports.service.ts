import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { StorageService } from 'src/lib/storage/storage.service';
import {
  CodePrefix,
  generateUniqueCode,
} from 'src/lib/prisma/code-generator';
import { CreateDistributionReportDto } from './dto/create-distribution-report.dto';
import { RequestReportUploadUrlDto } from './dto/request-report-upload-url.dto';
import { AdminReportsQueryDto } from './dto/admin-reports-query.dto';
import { DistributionReportStatus } from 'src/generated/prisma/client';

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Generates a presigned S3/R2 direct upload URL for a monthly distribution statement.
   */
  async getUploadUrl(dto: RequestReportUploadUrlDto) {
    const whiteLabel = await this.prisma.whiteLabel.findUnique({
      where: { id: dto.whiteLabelId },
    });

    if (!whiteLabel) {
      throw new NotFoundException(`WhiteLabel ${dto.whiteLabelId} not found`);
    }

    const cleanFileName = dto.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const period = dto.reportingPeriod.replace(/[^a-zA-Z0-9-]/g, '_');
    const key = `reports/${dto.whiteLabelId}/${period}-${Date.now()}-${cleanFileName}`;

    const uploadUrl = await this.storageService.getPresignedUploadUrl(
      key,
      dto.mimeType,
      3600,
    );

    return {
      uploadUrl,
      key,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      reportingPeriod: dto.reportingPeriod,
      whiteLabelId: dto.whiteLabelId,
    };
  }

  /**
   * Creates and publishes a monthly distribution statement for a WhiteLabel tenant.
   */
  async createReport(
    dto: CreateDistributionReportDto,
    adminUserId: string,
  ) {
    const whiteLabel = await this.prisma.whiteLabel.findUnique({
      where: { id: dto.whiteLabelId },
    });

    if (!whiteLabel) {
      throw new NotFoundException(`WhiteLabel ${dto.whiteLabelId} not found`);
    }

    const code = await generateUniqueCode(
      this.prisma,
      'distributionReport',
      CodePrefix.DISTRIBUTION_REPORT,
    );

    const report = await this.prisma.distributionReport.create({
      data: {
        code,
        title: dto.title,
        reportingPeriod: dto.reportingPeriod,
        totalRevenueBdt: dto.totalRevenueBdt,
        totalRevenueUsd: dto.totalRevenueUsd,
        totalStreams: dto.totalStreams ? BigInt(dto.totalStreams) : BigInt(0),
        fileKey: dto.fileKey,
        fileName: dto.fileName,
        fileSizeBytes: dto.fileSizeBytes,
        mimeType: dto.mimeType,
        notes: dto.notes,
        status: DistributionReportStatus.PUBLISHED,
        whiteLabelId: dto.whiteLabelId,
        uploadedByPlatformUserId: adminUserId,
      },
      include: {
        whiteLabel: {
          select: {
            id: true,
            code: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    return {
      ...report,
      totalStreams: report.totalStreams?.toString() || '0',
    };
  }

  /**
   * Lists uploaded reports across all or selected whitelabels.
   */
  async listReports(query: AdminReportsQueryDto) {
    const { whiteLabelId, reportingPeriod, search, page = 1, limit = 20 } =
      query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (whiteLabelId) {
      where.whiteLabelId = whiteLabelId;
    }

    if (reportingPeriod) {
      where.reportingPeriod = reportingPeriod;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
        { whiteLabel: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.distributionReport.count({ where }),
      this.prisma.distributionReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ reportingPeriod: 'desc' }, { createdAt: 'desc' }],
        include: {
          whiteLabel: {
            select: {
              id: true,
              code: true,
              name: true,
              subdomain: true,
            },
          },
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const formattedItems = items.map((r) => ({
      ...r,
      totalStreams: r.totalStreams ? r.totalStreams.toString() : '0',
    }));

    return {
      data: formattedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Generates download link for admin staff.
   */
  async getReportDownloadUrl(code: string) {
    const report = await this.prisma.distributionReport.findUnique({
      where: { code },
      include: {
        whiteLabel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report ${code} not found`);
    }

    const downloadUrl = await this.storageService.getPresignedUrl(
      report.fileKey,
      7200,
    );

    return {
      code: report.code,
      title: report.title,
      fileName: report.fileName,
      mimeType: report.mimeType,
      fileSizeBytes: report.fileSizeBytes,
      whiteLabel: report.whiteLabel,
      downloadUrl,
    };
  }

  /**
   * Deletes a monthly distribution statement.
   */
  async deleteReport(code: string) {
    const report = await this.prisma.distributionReport.findUnique({
      where: { code },
    });

    if (!report) {
      throw new NotFoundException(`Report ${code} not found`);
    }

    await this.prisma.distributionReport.delete({
      where: { code },
    });

    if (report.fileKey) {
      try {
        await this.storageService.deleteFile(report.fileKey);
      } catch {
        // Non-blocking cleanup
      }
    }

    return {
      success: true,
      message: `Report ${code} successfully deleted`,
    };
  }
}
