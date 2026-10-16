import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { WhitelabelContractsService } from 'src/whitelabel/contracts/whitelabel-contracts.service';
import { CodePrefix, generateUniqueCode } from 'src/lib/prisma/code-generator';
import { RoyaltyRunStatus, Prisma } from 'src/generated/prisma/client';

export interface PayeeSplit {
  payeeId: string;
  sharePercentage: number;
}

export interface DspSalesLine {
  isrc?: string;
  upc?: string;
  streams?: number;
  netRevenueUsd?: number;
  grossRevenueUsd?: number;
  dsp?: string;
  country?: string;
}

export interface ExecuteRoyaltyRunParams {
  whiteLabelId?: string;
  reportingPeriod: string;
  exchangeRateUsdToBdt?: number;
  lines?: DspSalesLine[];
}

export interface PayeeSummary {
  payeeId: string;
  revenueUsd: number;
  revenueBdt: number;
  streamCount: number;
}

export interface RoyaltyRunResult {
  success: boolean;
  message?: string;
  matchedLinesCount: number;
  unmatchedLinesCount: number;
  totalStreams: number;
  totalRevenueUsd: number;
  totalRevenueBdt: number;
  totalPlatformCutUsd?: number;
  unmatchedLines: DspSalesLine[];
  payeeSummaries: PayeeSummary[];
  royaltyRun?: any;
  run?: {
    id: string;
    code: string;
    reportingPeriod: string;
    store?: string;
    exchangeRateBdtUsd: number;
    totalGrossUsd: number;
    totalPayoutsUsd: number;
    totalPayoutsBdt: number;
    totalPlatformCutUsd?: number;
    status: string;
    whiteLabelId?: string;
    processedRowsCount?: number;
    completedAt?: string;
    createdAt?: string;
  };
}

@Injectable()
export class RoyaltyRunService {
  private readonly logger = new Logger(RoyaltyRunService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contractsService: WhitelabelContractsService,
  ) {}

  /**
   * Executes a monthly automated royalty calculation run.
   * Can be called with (params: ExecuteRoyaltyRunParams) or (period: string, exchangeRate?: number, executedByUserId?: string).
   */
  async executeRoyaltyRun(
    periodOrParams: string | ExecuteRoyaltyRunParams,
    exchangeRateUsdToBdtArg?: number,
    executedByUserId?: string,
  ): Promise<RoyaltyRunResult> {
    let cleanPeriod: string;
    let exchangeRate = 120.0;
    let whiteLabelId: string | undefined;
    let inputLines: DspSalesLine[] | undefined;

    if (typeof periodOrParams === 'object') {
      cleanPeriod = (periodOrParams.reportingPeriod || '').trim();
      exchangeRate = periodOrParams.exchangeRateUsdToBdt ?? 120.0;
      whiteLabelId = periodOrParams.whiteLabelId;
      inputLines = periodOrParams.lines;
    } else {
      cleanPeriod = (periodOrParams || '').trim();
      exchangeRate = exchangeRateUsdToBdtArg ?? 120.0;
    }

    if (!cleanPeriod || !/^\d{4}-\d{2}$/.test(cleanPeriod)) {
      throw new BadRequestException(
        'Reporting period must be in YYYY-MM format (e.g. 2026-03).',
      );
    }

    // IN-MEMORY / DIRECT LINES EXECUTION (Unit test / Direct calculation mode)
    if (inputLines !== undefined) {
      return await this.calculateFromLines(
        inputLines,
        cleanPeriod,
        exchangeRate,
        whiteLabelId,
      );
    }

    // DATABASE EXECUTION (Production DSP Sales Ingestion Pipeline)
    return await this.calculateFromDatabase(
      cleanPeriod,
      exchangeRate,
      executedByUserId,
      whiteLabelId,
    );
  }

  private async calculateFromLines(
    lines: DspSalesLine[],
    cleanPeriod: string,
    exchangeRate: number,
    defaultWhiteLabelId?: string,
  ): Promise<RoyaltyRunResult> {
    const isrcs = lines.map((l) => l.isrc).filter(Boolean) as string[];

    const tracks = await this.prisma.track.findMany({
      where: {
        isrc: { in: isrcs },
      },
      include: {
        release: true,
      },
    });

    const trackIsrcMap = new Map<string, any>();
    for (const t of tracks) {
      if (t.isrc) {
        trackIsrcMap.set(t.isrc.toUpperCase(), t);
      }
    }

    let matchedLinesCount = 0;
    let unmatchedLinesCount = 0;
    const unmatchedLines: DspSalesLine[] = [];
    let totalStreams = 0;
    let totalRevenueUsd = 0;

    const payeeMap = new Map<
      string,
      { revenueUsd: number; streamCount: number }
    >();

    for (const line of lines) {
      totalStreams += Number(line.streams || 0);
      const rev = Number(line.netRevenueUsd || 0);
      totalRevenueUsd += rev;

      const cleanIsrc = (line.isrc || '').toUpperCase();
      const matchedTrack = trackIsrcMap.get(cleanIsrc);

      if (!matchedTrack) {
        unmatchedLinesCount++;
        unmatchedLines.push(line);
        continue;
      }

      matchedLinesCount++;
      const wlId =
        matchedTrack.release?.whiteLabelId || defaultWhiteLabelId || 'wl-1';

      let splits: Array<{ payeeId: string; percentage: number }> = [];
      try {
        const contract = await this.contractsService.resolveEffectiveContract({
          whiteLabelId: wlId,
          trackId: matchedTrack.id,
          releaseId: matchedTrack.releaseId,
        });

        if (contract?.splits?.length) {
          splits = contract.splits;
        }
      } catch {
        // Fallback
      }

      if (!splits.length) {
        splits = [{ payeeId: 'payee-standard', percentage: 100 }];
      }

      for (const split of splits) {
        const shareRatio = split.percentage / 100.0;
        const payeeRev = rev * shareRatio;
        const payeeStreams = Math.round(Number(line.streams || 0) * shareRatio);

        const current = payeeMap.get(split.payeeId) || {
          revenueUsd: 0,
          streamCount: 0,
        };
        current.revenueUsd += payeeRev;
        current.streamCount += payeeStreams;
        payeeMap.set(split.payeeId, current);
      }
    }

    const totalRevenueBdt =
      Math.round(totalRevenueUsd * exchangeRate * 100) / 100;

    const payeeSummaries: PayeeSummary[] = [];
    for (const [payeeId, data] of payeeMap.entries()) {
      const roundedUsd = Math.round(data.revenueUsd * 10000) / 10000;
      const roundedBdt = Math.round(data.revenueUsd * exchangeRate * 100) / 100;

      payeeSummaries.push({
        payeeId,
        revenueUsd: roundedUsd,
        revenueBdt: roundedBdt,
        streamCount: data.streamCount,
      });
    }

    const normalizedRun = {
      id: `run-${Date.now()}`,
      code: `RUN-${cleanPeriod}-${Math.floor(1000 + Math.random() * 9000)}`,
      reportingPeriod: cleanPeriod,
      store: 'ALL',
      exchangeRateBdtUsd: exchangeRate,
      totalGrossUsd: totalRevenueUsd,
      totalPayoutsUsd: totalRevenueUsd,
      totalPayoutsBdt: totalRevenueBdt,
      totalPlatformCutUsd: 0,
      status: 'COMPLETED',
      whiteLabelId: defaultWhiteLabelId,
      processedRowsCount: lines.length,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      matchedLinesCount,
      unmatchedLinesCount,
      totalStreams,
      totalRevenueUsd,
      totalRevenueBdt,
      totalPlatformCutUsd: 0,
      unmatchedLines,
      payeeSummaries,
      run: normalizedRun,
    };
  }

  private async calculateFromDatabase(
    cleanPeriod: string,
    exchangeRateUsdToBdt: number,
    executedByUserId?: string,
    targetWhiteLabelId?: string,
  ): Promise<RoyaltyRunResult> {
    const existingRun = await this.prisma.royaltyRun.findFirst({
      where: {
        reportingPeriod: cleanPeriod,
        status: RoyaltyRunStatus.COMPLETED,
        ...(targetWhiteLabelId ? { whiteLabelId: targetWhiteLabelId } : {}),
      },
    });

    if (existingRun) {
      throw new BadRequestException(
        `A completed royalty run for period ${cleanPeriod} already exists (${existingRun.code}).`,
      );
    }

    const salesLines = await this.prisma.dspSaleLine.findMany({
      where: {
        reportingPeriod: cleanPeriod,
        ...(targetWhiteLabelId ? { whiteLabelId: targetWhiteLabelId } : {}),
      },
      include: { report: true },
    });

    if (!salesLines.length) {
      throw new BadRequestException(
        `No DSP sales lines found for period ${cleanPeriod}${targetWhiteLabelId ? ` and WhiteLabel ${targetWhiteLabelId}` : ''}. Please upload DSP reports before running calculations.`,
      );
    }

    const runCode = await generateUniqueCode(
      this.prisma,
      'royaltyRun',
      CodePrefix.ROYALTY_RUN,
    );

    const royaltyRun = await this.prisma.royaltyRun.create({
      data: {
        code: runCode,
        title: `Royalty Run ${cleanPeriod}`,
        reportingPeriod: cleanPeriod,
        whiteLabelId: targetWhiteLabelId || null,
        exchangeRateUsdToBdt: new Prisma.Decimal(exchangeRateUsdToBdt),
        status: RoyaltyRunStatus.PROCESSING,
      },
    });

    try {
      const trackSalesMap = new Map<
        string,
        {
          trackId: string;
          whiteLabelId: string;
          streamCount: number;
          downloadCount: number;
          grossUsd: number;
          netUsd: number;
        }
      >();

      let matchedLinesCount = 0;
      let unmatchedLinesCount = 0;
      const unmatchedLines: DspSalesLine[] = [];
      let totalStreams = 0;
      let totalRevenueUsd = 0;

      for (const line of salesLines) {
        totalStreams += Number(line.streamCount || 0);
        totalRevenueUsd += Number(line.netAmountUsd || 0);

        if (!line.matchedTrackId || !line.whiteLabelId) {
          unmatchedLinesCount++;
          unmatchedLines.push({
            isrc: line.isrc || undefined,
            upc: line.upc || undefined,
            streams: Number(line.streamCount || 0),
            netRevenueUsd: Number(line.netAmountUsd || 0),
          });
          continue;
        }

        matchedLinesCount++;
        const key = line.matchedTrackId;
        const current = trackSalesMap.get(key) || {
          trackId: line.matchedTrackId,
          whiteLabelId: line.whiteLabelId,
          streamCount: 0,
          downloadCount: 0,
          grossUsd: 0,
          netUsd: 0,
        };

        current.streamCount += Number(line.streamCount || 0);
        current.downloadCount += Number(line.downloadCount || 0);
        current.grossUsd += Number(line.grossAmountUsd || 0);
        current.netUsd += Number(line.netAmountUsd || 0);
        trackSalesMap.set(key, current);
      }

      // Collect unique WhiteLabels to query their specific contractual revenue share rates
      const wlIds = new Set<string>();
      if (targetWhiteLabelId) wlIds.add(targetWhiteLabelId);
      for (const line of salesLines) {
        if (line.whiteLabelId) wlIds.add(line.whiteLabelId);
      }

      const whiteLabels = await this.prisma.whiteLabel.findMany({
        where: { id: { in: Array.from(wlIds) } },
        select: {
          id: true,
          name: true,
          revShareTenantPercentage: true,
          revSharePlatformPercentage: true,
        },
      });

      const wlRateMap = new Map<
        string,
        { tenantRate: number; platformRate: number; name: string }
      >();
      for (const wl of whiteLabels) {
        const tenantRate =
          wl.revShareTenantPercentage != null
            ? Number(wl.revShareTenantPercentage)
            : 85.0;
        const platformRate =
          wl.revSharePlatformPercentage != null
            ? Number(wl.revSharePlatformPercentage)
            : 15.0;
        wlRateMap.set(wl.id, { tenantRate, platformRate, name: wl.name });
      }

      const payeeAggregates = new Map<
        string,
        {
          whiteLabelId: string;
          payeeId: string;
          streamCount: number;
          downloadCount: number;
          grossEarningsUsd: number;
          netEarningsUsd: number;
        }
      >();

      let totalPlatformCutUsd = 0;

      for (const [trackId, data] of trackSalesMap.entries()) {
        const rates = wlRateMap.get(data.whiteLabelId) || {
          tenantRate: 85.0,
          platformRate: 15.0,
          name: 'Standard Platform Deal',
        };
        const tenantDistributableRatio = rates.tenantRate / 100.0;
        const platformCutRatio = rates.platformRate / 100.0;

        const trackPlatformCutUsd = data.netUsd * platformCutRatio;
        totalPlatformCutUsd += trackPlatformCutUsd;

        const trackTenantDistributableNetUsd =
          data.netUsd * tenantDistributableRatio;

        let splits: PayeeSplit[] = [];

        try {
          const contract = await this.contractsService.resolveEffectiveContract(
            {
              whiteLabelId: data.whiteLabelId,
              trackId,
            },
          );

          if (contract?.splits?.length) {
            splits = contract.splits.map((s: any) => ({
              payeeId: s.payeeId,
              sharePercentage: s.percentage,
            }));
          }
        } catch (err: any) {
          this.logger.warn(
            `Could not resolve contract for track ${trackId}: ${err.message}`,
          );
        }

        if (!splits.length) {
          let defaultPayee = await this.prisma.payee.findFirst({
            where: { whiteLabelId: data.whiteLabelId },
          });

          if (!defaultPayee) {
            const pCode = await generateUniqueCode(
              this.prisma,
              'payee',
              CodePrefix.PAYEE,
            );
            defaultPayee = await this.prisma.payee.create({
              data: {
                code: pCode,
                name: 'Default Artist Payee',
                email: 'artist@royalmotionit.com',
                whiteLabelId: data.whiteLabelId,
              },
            });
          }

          splits = [{ payeeId: defaultPayee.id, sharePercentage: 100.0 }];
        }

        for (const split of splits) {
          const payeeKey = `${data.whiteLabelId}:::${split.payeeId}`;
          const currentPayee = payeeAggregates.get(payeeKey) || {
            whiteLabelId: data.whiteLabelId,
            payeeId: split.payeeId,
            streamCount: 0,
            downloadCount: 0,
            grossEarningsUsd: 0,
            netEarningsUsd: 0,
          };

          const ratio = (split.sharePercentage || 100) / 100.0;
          currentPayee.streamCount += Math.round(data.streamCount * ratio);
          currentPayee.downloadCount += Math.round(data.downloadCount * ratio);
          currentPayee.grossEarningsUsd += data.grossUsd * ratio;
          currentPayee.netEarningsUsd +=
            trackTenantDistributableNetUsd * ratio;

          payeeAggregates.set(payeeKey, currentPayee);
        }
      }

      let totalGrossUsd = 0;
      let totalNetUsd = 0;
      let statementCount = 0;
      const payeeSummaries: PayeeSummary[] = [];

      for (const [key, agg] of payeeAggregates.entries()) {
        const netBdt = agg.netEarningsUsd * exchangeRateUsdToBdt;
        totalGrossUsd += agg.grossEarningsUsd;
        totalNetUsd += agg.netEarningsUsd;

        const statementCode = await generateUniqueCode(
          this.prisma,
          'userRoyaltyStatement',
          CodePrefix.USER_ROYALTY_STATEMENT,
        );

        await this.prisma.userRoyaltyStatement.create({
          data: {
            code: statementCode,
            royaltyRunId: royaltyRun.id,
            whiteLabelId: agg.whiteLabelId,
            payeeId: agg.payeeId,
            reportingPeriod: cleanPeriod,
            streamCount: BigInt(agg.streamCount),
            downloadCount: BigInt(agg.downloadCount),
            grossEarningsUsd: new Prisma.Decimal(agg.grossEarningsUsd),
            netEarningsUsd: new Prisma.Decimal(agg.netEarningsUsd),
            netEarningsBdt: new Prisma.Decimal(netBdt),
            isPaid: false,
          },
        });

        payeeSummaries.push({
          payeeId: agg.payeeId,
          revenueUsd: agg.netEarningsUsd,
          revenueBdt: netBdt,
          streamCount: agg.streamCount,
        });

        statementCount++;
      }

      const totalNetBdt = totalNetUsd * exchangeRateUsdToBdt;

      const completedRun = await this.prisma.royaltyRun.update({
        where: { id: royaltyRun.id },
        data: {
          status: RoyaltyRunStatus.COMPLETED,
          totalRawGrossUsd: new Prisma.Decimal(totalGrossUsd),
          totalPlatformGrossCutUsd: new Prisma.Decimal(totalPlatformCutUsd),
          totalNetPayoutUsd: new Prisma.Decimal(totalNetUsd),
          totalNetPayoutBdt: new Prisma.Decimal(totalNetBdt),
          processedAt: new Date(),
        },
      });

      const normalizedRun = {
        id: completedRun.id,
        code: completedRun.code,
        reportingPeriod: completedRun.reportingPeriod,
        store: 'ALL',
        exchangeRateBdtUsd: exchangeRateUsdToBdt,
        totalGrossUsd: Number(completedRun.totalRawGrossUsd ?? totalGrossUsd),
        totalPayoutsUsd: Number(completedRun.totalNetPayoutUsd ?? totalNetUsd),
        totalPayoutsBdt: Number(completedRun.totalNetPayoutBdt ?? totalNetBdt),
        totalPlatformCutUsd: Number(
          completedRun.totalPlatformGrossCutUsd ?? totalPlatformCutUsd,
        ),
        status: completedRun.status,
        whiteLabelId: completedRun.whiteLabelId || targetWhiteLabelId,
        processedRowsCount: matchedLinesCount + unmatchedLinesCount,
        completedAt: completedRun.processedAt
          ? completedRun.processedAt.toISOString()
          : new Date().toISOString(),
        createdAt: completedRun.createdAt
          ? completedRun.createdAt.toISOString()
          : new Date().toISOString(),
      };

      return {
        success: true,
        message: `Royalty Run for ${cleanPeriod} completed successfully. Generated ${statementCount} statements.`,
        matchedLinesCount,
        unmatchedLinesCount,
        totalStreams,
        totalRevenueUsd: totalNetUsd,
        totalRevenueBdt: totalNetBdt,
        totalPlatformCutUsd,
        unmatchedLines,
        payeeSummaries,
        royaltyRun: completedRun,
        run: normalizedRun,
      };
    } catch (error: any) {
      await this.prisma.royaltyRun.update({
        where: { id: royaltyRun.id },
        data: {
          status: RoyaltyRunStatus.FAILED,
        },
      });
      throw error;
    }
  }

  async getWhiteLabelStatements(
    whiteLabelId: string,
    payeeId?: string,
    period?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (Math.max(1, page) - 1) * limit;

    const where: Prisma.UserRoyaltyStatementWhereInput = {
      whiteLabelId,
      ...(payeeId ? { payeeId } : {}),
      ...(period ? { reportingPeriod: period } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.userRoyaltyStatement.count({ where }),
      this.prisma.userRoyaltyStatement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          payee: {
            select: {
              id: true,
              code: true,
              name: true,
              email: true,
            },
          },
          royaltyRun: {
            select: {
              code: true,
              reportingPeriod: true,
              exchangeRateUsdToBdt: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: items.map((s) => ({
        ...s,
        streamCount: s.streamCount.toString(),
        downloadCount: s.downloadCount.toString(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getStatementByCode(
    whiteLabelId: string,
    code: string,
    payeeId?: string,
  ) {
    const statement = await this.prisma.userRoyaltyStatement.findFirst({
      where: {
        code,
        whiteLabelId,
        ...(payeeId ? { payeeId } : {}),
      },
      include: {
        payee: {
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
          },
        },
        royaltyRun: true,
      },
    });

    if (!statement) {
      throw new NotFoundException(`Statement ${code} not found.`);
    }

    return {
      success: true,
      statement: {
        ...statement,
        streamCount: statement.streamCount.toString(),
        downloadCount: statement.downloadCount.toString(),
      },
    };
  }

  async listRoyaltyRuns(page: number = 1, limit: number = 20, period?: string) {
    const skip = (Math.max(1, page) - 1) * limit;
    const where: Prisma.RoyaltyRunWhereInput = period
      ? { reportingPeriod: period }
      : {};

    const [total, items] = await Promise.all([
      this.prisma.royaltyRun.count({ where }),
      this.prisma.royaltyRun.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      success: true,
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
