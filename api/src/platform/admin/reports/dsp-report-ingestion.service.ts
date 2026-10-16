import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import {
  CodePrefix,
  generateUniqueCode,
} from 'src/lib/prisma/code-generator';
import { DspStore, DspReportStatus, Prisma } from 'src/generated/prisma/client';

export interface ParsedSaleRow {
  store: DspStore;
  reportingPeriod: string;
  countryCode: string;
  isrc?: string;
  upc?: string;
  trackTitle?: string;
  artistName?: string;
  streamCount: number;
  downloadCount: number;
  grossUsd: number;
  netUsd: number;
}

@Injectable()
export class DspReportIngestionService {
  private readonly logger = new Logger(DspReportIngestionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Detects delimiter and parses CSV or TSV raw file content into normalized rows.
   */
  public parseReportText(fileContent: string, defaultStore: DspStore, defaultPeriod: string): ParsedSaleRow[] {
    const lines = fileContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new BadRequestException('DSP report file is empty or missing headers.');
    }

    const headerLine = lines[0];
    const delimiter = headerLine.includes('\t')
      ? '\t'
      : headerLine.includes(';')
      ? ';'
      : ',';

    const rawHeaders = headerLine
      .split(delimiter)
      .map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

    const getColIndex = (aliases: string[]): number => {
      return rawHeaders.findIndex((h) => aliases.some((alias) => h === alias || h.includes(alias)));
    };

    const storeIdx = getColIndex(['store', 'dsp', 'platform', 'service']);
    const periodIdx = getColIndex(['reportingperiod', 'reporting_period', 'period', 'month', 'date']);
    const countryIdx = getColIndex(['countrycode', 'country_code', 'country', 'territory']);
    const isrcIdx = getColIndex(['isrc', 'track_isrc']);
    const upcIdx = getColIndex(['upc', 'ean', 'grid', 'album_upc']);
    const titleIdx = getColIndex(['tracktitle', 'track_title', 'track', 'song', 'title']);
    const artistIdx = getColIndex(['artistname', 'artist_name', 'artist', 'creator']);
    const streamIdx = getColIndex(['streamcount', 'stream_count', 'streams', 'quantity', 'units', 'plays']);
    const downloadIdx = getColIndex(['downloadcount', 'download_count', 'downloads']);
    const grossIdx = getColIndex(['grossusd', 'gross_usd', 'gross', 'gross_amount']);
    const netIdx = getColIndex(['netusd', 'net_usd', 'net', 'net_amount', 'net_revenue', 'royalty', 'earnings']);

    const rows: ParsedSaleRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Handle quotes in CSV/TSV
      const cols = this.splitLineWithQuotes(line, delimiter);
      if (cols.length === 0) continue;

      const storeRaw = storeIdx >= 0 ? cols[storeIdx]?.toUpperCase() : '';
      const resolvedStore = this.resolveDspStore(storeRaw) || defaultStore;

      const reportingPeriod = (periodIdx >= 0 && cols[periodIdx]?.trim()) || defaultPeriod;
      const countryCode = (countryIdx >= 0 ? cols[countryIdx]?.trim().toUpperCase() : 'WW') || 'WW';
      const isrc = isrcIdx >= 0 ? cols[isrcIdx]?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : undefined;
      const upc = upcIdx >= 0 ? cols[upcIdx]?.replace(/[^0-9]/g, '') : undefined;
      const trackTitle = titleIdx >= 0 ? cols[titleIdx]?.trim() : undefined;
      const artistName = artistIdx >= 0 ? cols[artistIdx]?.trim() : undefined;

      const streamCount = streamIdx >= 0 ? Math.max(0, parseInt(cols[streamIdx]?.replace(/,/g, '') || '0', 10) || 0) : 0;
      const downloadCount = downloadIdx >= 0 ? Math.max(0, parseInt(cols[downloadIdx]?.replace(/,/g, '') || '0', 10) || 0) : 0;
      const grossUsd = grossIdx >= 0 ? Math.max(0, parseFloat(cols[grossIdx]?.replace(/[$,]/g, '') || '0') || 0) : 0;
      const netUsd = netIdx >= 0 ? Math.max(0, parseFloat(cols[netIdx]?.replace(/[$,]/g, '') || '0') || 0) : 0;

      rows.push({
        store: resolvedStore,
        reportingPeriod,
        countryCode: countryCode.substring(0, 10),
        isrc: isrc || undefined,
        upc: upc || undefined,
        trackTitle,
        artistName,
        streamCount,
        downloadCount,
        grossUsd,
        netUsd,
      });
    }

    return rows;
  }

  private splitLineWithQuotes(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.replace(/^["']|["']$/g, '').trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.replace(/^["']|["']$/g, '').trim());
    return result;
  }

  private resolveDspStore(rawStore: string): DspStore {
    if (!rawStore) return DspStore.OTHER;
    if (rawStore.includes('SPOTIFY')) return DspStore.SPOTIFY;
    if (rawStore.includes('APPLE') || rawStore.includes('ITUNES')) return DspStore.APPLE_MUSIC;
    if (rawStore.includes('YOUTUBE') || rawStore.includes('GOOGLE')) return DspStore.YOUTUBE;
    if (rawStore.includes('AMAZON')) return DspStore.AMAZON;
    if (rawStore.includes('DEEZER')) return DspStore.DEEZER;
    if (rawStore.includes('TIDAL')) return DspStore.TIDAL;
    if (rawStore.includes('TIKTOK')) return DspStore.TIKTOK;
    if (rawStore.includes('META') || rawStore.includes('FACEBOOK') || rawStore.includes('INSTAGRAM')) return DspStore.META;
    return DspStore.OTHER;
  }

  /**
   * Ingests parsed DSP sales lines, matches them against catalog Tracks and Releases,
   * associates WhiteLabel tenants, and persists records into PostgreSQL.
   */
  async ingestDspReport(params: {
    fileName: string;
    fileContent: string;
    store: DspStore;
    reportingPeriod: string;
    uploadedByPlatformUserId?: string;
  }) {
    const { fileName, fileContent, store, reportingPeriod, uploadedByPlatformUserId } = params;

    const parsedRows = this.parseReportText(fileContent, store, reportingPeriod);
    if (!parsedRows.length) {
      throw new BadRequestException('No valid sales record rows could be parsed from the file.');
    }

    // 1. Collect all distinct non-empty ISRCs and UPCs for fast batch matching
    const isrcs = Array.from(new Set(parsedRows.map((r) => r.isrc).filter(Boolean) as string[]));
    const upcs = Array.from(new Set(parsedRows.map((r) => r.upc).filter(Boolean) as string[]));

    // 2. Fetch matching Tracks by ISRC (case-insensitive)
    const matchedTracks = isrcs.length
      ? await this.prisma.track.findMany({
          where: {
            isrc: { in: isrcs, mode: 'insensitive' },
          },
          select: {
            id: true,
            isrc: true,
            release: {
              select: {
                id: true,
                upc: true,
                whiteLabelId: true,
              },
            },
          },
        })
      : [];

    const isrcToTrackMap = new Map<string, { trackId: string; whiteLabelId: string }>();
    for (const t of matchedTracks) {
      if (t.isrc) {
        isrcToTrackMap.set(t.isrc.toUpperCase(), {
          trackId: t.id,
          whiteLabelId: t.release.whiteLabelId,
        });
      }
    }

    // 3. Fetch matching Releases by UPC for lines without ISRC match
    const matchedReleases = upcs.length
      ? await this.prisma.release.findMany({
          where: {
            upc: { in: upcs },
          },
          select: {
            id: true,
            upc: true,
            whiteLabelId: true,
            tracks: {
              select: { id: true },
              take: 1,
            },
          },
        })
      : [];

    const upcToReleaseMap = new Map<string, { trackId?: string; whiteLabelId: string }>();
    for (const r of matchedReleases) {
      if (r.upc) {
        upcToReleaseMap.set(r.upc, {
          trackId: r.tracks?.[0]?.id,
          whiteLabelId: r.whiteLabelId,
        });
      }
    }

    // 4. Generate report code and calculate totals
    const reportCode = await generateUniqueCode(
      this.prisma,
      'dspRawReport' as any,
      CodePrefix.DSP_RAW_REPORT,
    );

    let totalGrossUsd = 0;
    let totalNetUsd = 0;
    let matchedCount = 0;
    let unmatchedCount = 0;

    const saleLineData: Prisma.DspSaleLineCreateManyReportInput[] = parsedRows.map((row) => {
      totalGrossUsd += row.grossUsd;
      totalNetUsd += row.netUsd;

      let matchedTrackId: string | undefined;
      let whiteLabelId: string | undefined;

      // ISRC matching takes precedence
      if (row.isrc && isrcToTrackMap.has(row.isrc.toUpperCase())) {
        const match = isrcToTrackMap.get(row.isrc.toUpperCase())!;
        matchedTrackId = match.trackId;
        whiteLabelId = match.whiteLabelId;
      } else if (row.upc && upcToReleaseMap.has(row.upc)) {
        const match = upcToReleaseMap.get(row.upc)!;
        matchedTrackId = match.trackId;
        whiteLabelId = match.whiteLabelId;
      }

      if (matchedTrackId && whiteLabelId) {
        matchedCount++;
      } else {
        unmatchedCount++;
      }

      return {
        store: row.store,
        reportingPeriod: row.reportingPeriod,
        countryCode: row.countryCode,
        isrc: row.isrc,
        upc: row.upc,
        trackTitle: row.trackTitle,
        artistName: row.artistName,
        streamCount: BigInt(row.streamCount),
        downloadCount: BigInt(row.downloadCount),
        grossAmountUsd: new Prisma.Decimal(row.grossUsd),
        netAmountUsd: new Prisma.Decimal(row.netUsd),
        matchedTrackId: matchedTrackId || null,
        whiteLabelId: whiteLabelId || null,
      };
    });

    // 5. Persist DspRawReport and DspSaleLine records inside a transaction
    const [report] = await this.prisma.$transaction(async (tx) => {
      const createdReport = await tx.dspRawReport.create({
        data: {
          code: reportCode,
          store,
          reportingPeriod,
          fileName,
          rowCount: parsedRows.length,
          matchedCount,
          unmatchedCount,
          totalGrossUsd: new Prisma.Decimal(totalGrossUsd),
          totalNetUsd: new Prisma.Decimal(totalNetUsd),
          status: DspReportStatus.PROCESSED,
          uploadedByPlatformUserId,
        },
      });

      // Batch insert in chunks of 1000 for PostgreSQL parameters boundary protection
      const chunkSize = 1000;
      for (let i = 0; i < saleLineData.length; i += chunkSize) {
        const chunk = saleLineData.slice(i, i + chunkSize).map((line) => ({
          ...line,
          reportId: createdReport.id,
        }));
        await tx.dspSaleLine.createMany({ data: chunk });
      }

      return [createdReport];
    });

    this.logger.log(
      `[DSP Ingest] Ingested ${report.rowCount} sales lines for period ${report.reportingPeriod}. Matched: ${matchedCount}, Unmatched: ${unmatchedCount}`,
    );

    return {
      success: true,
      message: `DSP Sales Report ingested successfully for ${reportingPeriod}.`,
      report: {
        id: report.id,
        code: report.code,
        store: report.store,
        reportingPeriod: report.reportingPeriod,
        fileName: report.fileName,
        rowCount: report.rowCount,
        matchedCount,
        unmatchedCount,
        totalGrossUsd,
        totalNetUsd,
        status: report.status,
      },
    };
  }
}
