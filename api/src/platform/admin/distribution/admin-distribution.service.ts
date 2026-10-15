import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { StorageService } from 'src/lib/storage/storage.service';
import { AcrCloudService } from 'src/lib/acrcloud/acrcloud.service';
import { AdminDistributionQueryDto } from './dto/admin-distribution-query.dto';
import { UpdateReleaseStatusDto } from './dto/update-release-status.dto';
import { ReleaseStatus } from 'src/generated/prisma/client';

@Injectable()
export class AdminDistributionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly acrCloudService: AcrCloudService,
  ) {}

  /**
   * Lists all submitted or processed releases across all whitelabels.
   */
  async listReleases(query: AdminDistributionQueryDto) {
    const { whiteLabelId, status, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (whiteLabelId) {
      where.whiteLabelId = whiteLabelId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { upc: { contains: search, mode: 'insensitive' } },
        { genre: { contains: search, mode: 'insensitive' } },
        { whiteLabel: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.release.count({ where }),
      this.prisma.release.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          whiteLabel: {
            select: {
              id: true,
              code: true,
              name: true,
              subdomain: true,
              customDomain: true,
              logoUrl: true,
            },
          },
          whiteLabelUser: {
            select: {
              id: true,
              code: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          contributors: true,
          _count: {
            select: { tracks: true },
          },
        },
      }),
    ]);

    const formattedItems = await Promise.all(
      items.map(async (r) => {
        let presignedCoverUrl = r.coverArtUrl;
        if (r.coverArtKey) {
          try {
            presignedCoverUrl = await this.storageService.getPresignedUrl(
              r.coverArtKey,
              3600,
            );
          } catch {
            presignedCoverUrl = r.coverArtUrl;
          }
        }
        return {
          ...r,
          presignedCoverUrl,
          trackCount: r._count.tracks,
        };
      }),
    );

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
   * Retrieves complete release dossier including all tracks, audio files, and artwork download links.
   */
  async getReleaseDossier(code: string) {
    const release = await this.prisma.release.findUnique({
      where: { code },
      include: {
        whiteLabel: {
          select: {
            id: true,
            code: true,
            name: true,
            subdomain: true,
            customDomain: true,
            supportEmail: true,
            contactFirstName: true,
            contactLastName: true,
            contactEmail: true,
          },
        },
        whiteLabelUser: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        contributors: true,
        tracks: {
          orderBy: [{ discNumber: 'asc' }, { trackNumber: 'asc' }],
          include: {
            contributors: true,
            audioScan: true,
          },
        },
      },
    });

    if (!release) {
      throw new NotFoundException(`Release ${code} not found`);
    }

    // Generate time-limited presigned download URLs for cover art and all audio files
    let coverArtDownloadUrl = release.coverArtUrl;
    if (release.coverArtKey) {
      try {
        coverArtDownloadUrl = await this.storageService.getPresignedUrl(
          release.coverArtKey,
          7200,
        );
      } catch {
        coverArtDownloadUrl = release.coverArtUrl;
      }
    }

    const tracksWithAudioDownloads = await Promise.all(
      release.tracks.map(async (track) => {
        let audioDownloadUrl = track.audioUrl;
        if (track.audioKey) {
          try {
            audioDownloadUrl = await this.storageService.getPresignedUrl(
              track.audioKey,
              7200,
            );
          } catch {
            audioDownloadUrl = track.audioUrl;
          }
        }
        return {
          ...track,
          audioDownloadUrl,
        };
      }),
    );

    return {
      ...release,
      coverArtDownloadUrl,
      tracks: tracksWithAudioDownloads,
    };
  }

  /**
   * Updates release status (e.g. IN_REVIEW, APPROVED, DISTRIBUTED, REJECTED).
   */
  async updateReleaseStatus(
    code: string,
    dto: UpdateReleaseStatusDto,
    adminUserId: string,
  ) {
    const release = await this.prisma.release.findUnique({
      where: { code },
    });

    if (!release) {
      throw new NotFoundException(`Release ${code} not found`);
    }

    if (
      dto.status === ReleaseStatus.REJECTED &&
      !dto.rejectionReason?.trim()
    ) {
      throw new BadRequestException(
        'Rejection reason is required when rejecting a release',
      );
    }

    const data: any = {
      status: dto.status,
      rejectionReason:
        dto.status === ReleaseStatus.REJECTED ? dto.rejectionReason : null,
      adminNotes: dto.adminNotes ?? release.adminNotes,
    };

    if (dto.status === ReleaseStatus.DISTRIBUTED && !release.distributedAt) {
      data.distributedAt = new Date();
    }

    const updated = await this.prisma.release.update({
      where: { code },
      data,
      include: {
        whiteLabel: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
        tracks: true,
      },
    });

    return updated;
  }

  /**
   * Generates a complete DSP metadata export bundle (JSON) for manual ingestion into Mother Company's DSP pipeline.
   */
  async exportReleaseMetadata(code: string) {
    const dossier = await this.getReleaseDossier(code);

    const exportBundle = {
      exportVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      motherPlatform: 'RoyalMotionIT Music Distribution Core',
      whiteLabel: {
        id: dossier.whiteLabel.id,
        name: dossier.whiteLabel.name,
        code: dossier.whiteLabel.code,
      },
      release: {
        code: dossier.code,
        title: dossier.title,
        type: dossier.type,
        upc: dossier.upc,
        catalogNumber: dossier.catalogNumber,
        releaseDate: dossier.releaseDate,
        originalReleaseDate: dossier.originalReleaseDate,
        genre: dossier.genre,
        subgenre: dossier.subgenre,
        labelName: dossier.labelName,
        cLine: dossier.cLine,
        pLine: dossier.pLine,
        coverArtUrl: dossier.coverArtDownloadUrl,
        contributors: dossier.contributors.map((c) => ({
          name: c.name,
          role: c.role,
          spotifyId: c.spotifyId,
          appleMusicId: c.appleMusicId,
        })),
        tracks: dossier.tracks.map((t) => ({
          code: t.code,
          trackNumber: t.trackNumber,
          discNumber: t.discNumber,
          title: t.title,
          version: t.version,
          isrc: t.isrc,
          iswc: t.iswc,
          durationSeconds: t.durationSeconds,
          explicit: t.explicit,
          language: t.language,
          lyrics: t.lyrics,
          audioDownloadUrl: t.audioDownloadUrl,
          fileName: t.fileName,
          fileSizeBytes: t.fileSizeBytes,
          mimeType: t.mimeType,
          contributors: t.contributors.map((c) => ({
            name: c.name,
            role: c.role,
            spotifyId: c.spotifyId,
            appleMusicId: c.appleMusicId,
          })),
        })),
      },
    };

    return exportBundle;
  }

  /**
   * Generates a direct presigned download URL for a track's audio file.
   */
  async getTrackDownloadUrl(trackCode: string) {
    const track = await this.prisma.track.findUnique({
      where: { code: trackCode },
      include: { release: true },
    });

    if (!track || !track.audioKey) {
      throw new NotFoundException(`Track ${trackCode} audio file not found`);
    }

    const downloadUrl = await this.storageService.getPresignedUrl(
      track.audioKey,
      7200,
    );

    return {
      code: track.code,
      title: track.title,
      fileName: track.fileName,
      mimeType: track.mimeType,
      downloadUrl,
    };
  }

  /**
   * Triggers an on-demand ACRCloud acoustic fingerprint scan for a track.
   */
  async rescanTrack(trackCode: string) {
    const track = await this.prisma.track.findUnique({
      where: { code: trackCode },
      include: { release: true },
    });

    if (!track) {
      throw new NotFoundException(`Track ${trackCode} not found`);
    }

    if (!track.audioKey) {
      throw new BadRequestException(
        `Track ${trackCode} has no uploaded audio file to scan`,
      );
    }

    const scan = await this.acrCloudService.scanTrack(track.id);

    return {
      success: true,
      trackCode: track.code,
      title: track.title,
      scan,
    };
  }
}
