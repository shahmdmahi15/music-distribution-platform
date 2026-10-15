import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { StorageService } from 'src/lib/storage/storage.service';
import { DistributionReportStatus } from 'src/generated/prisma/client';

@Injectable()
export class WhitelabelReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Retrieves list of published monthly distribution reports for the tenant.
   */
  async getReports(
    whiteLabelId: string,
    query: { period?: string; page?: number; limit?: number },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      whiteLabelId,
      status: DistributionReportStatus.PUBLISHED,
    };

    if (query.period) {
      where.reportingPeriod = query.period;
    }

    const [total, items] = await Promise.all([
      this.prisma.distributionReport.count({ where }),
      this.prisma.distributionReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ reportingPeriod: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    // Format BigInt streams to number/string for JSON serialization
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
   * Generates a secure presigned download link for a monthly statement.
   */
  async getReportDownloadUrl(whiteLabelId: string, code: string) {
    const report = await this.prisma.distributionReport.findFirst({
      where: {
        code,
        whiteLabelId,
        status: DistributionReportStatus.PUBLISHED,
      },
    });

    if (!report) {
      throw new NotFoundException(
        `Distribution report ${code} not found for this tenant`,
      );
    }

    const downloadUrl = await this.storageService.getPresignedUrl(
      report.fileKey,
      3600,
    );

    return {
      code: report.code,
      title: report.title,
      fileName: report.fileName,
      mimeType: report.mimeType,
      fileSizeBytes: report.fileSizeBytes,
      downloadUrl,
    };
  }

  /**
   * Calculates total aggregated earnings and stream telemetry.
   */
  async getSummaryMetrics(whiteLabelId: string) {
    const reports = await this.prisma.distributionReport.findMany({
      where: {
        whiteLabelId,
        status: DistributionReportStatus.PUBLISHED,
      },
      select: {
        totalRevenueBdt: true,
        totalRevenueUsd: true,
        totalStreams: true,
      },
    });

    let totalBdt = 0;
    let totalUsd = 0;
    let totalStreams = BigInt(0);

    for (const r of reports) {
      if (r.totalRevenueBdt) {
        totalBdt += Number(r.totalRevenueBdt);
      }
      if (r.totalRevenueUsd) {
        totalUsd += Number(r.totalRevenueUsd);
      }
      if (r.totalStreams) {
        totalStreams += r.totalStreams;
      }
    }

    return {
      totalRevenueBdt: totalBdt,
      totalRevenueUsd: totalUsd,
      totalStreams: totalStreams.toString(),
      reportCount: reports.length,
    };
  }
}
