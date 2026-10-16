import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { StorageService } from 'src/lib/storage/storage.service';
import { AcrCloudService } from 'src/lib/acrcloud/acrcloud.service';
import {
  CodePrefix,
  generateUniqueCode,
} from 'src/lib/prisma/code-generator';
import { CreateReleaseDto } from './dto/create-release.dto';
import { UpdateReleaseDto } from './dto/update-release.dto';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { QueryReleaseDto } from './dto/query-release.dto';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { QcStatus, ReleaseStatus } from 'src/generated/prisma/client';
import { WhitelabelQcValidationService } from './validation/whitelabel-qc-validation.service';
import { AnsDispatchService } from 'src/platform/admin/distribution/ans-dispatch.service';
import { RequestVevoChannelDto } from './dto/request-vevo-channel.dto';

@Injectable()
export class WhitelabelCatalogService {
  private readonly logger = new Logger(WhitelabelCatalogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly acrCloudService: AcrCloudService,
    private readonly qcValidationService: WhitelabelQcValidationService,
    private readonly ansDispatchService: AnsDispatchService,
  ) {}

  /**
   * Resolves WhiteLabel tenant AWS BYOC storage configuration.
   */
  private async getTenantStorageConfig(whiteLabelId: string) {
    const wl = await this.prisma.whiteLabel.findUnique({
      where: { id: whiteLabelId },
      select: {
        awsRegion: true,
        awsAccessKeyId: true,
        awsSecretAccessKey: true,
        bucketName: true,
      },
    });

    return wl && wl.awsAccessKeyId && wl.awsSecretAccessKey && wl.bucketName
      ? {
          awsRegion: wl.awsRegion,
          awsAccessKeyId: wl.awsAccessKeyId,
          awsSecretAccessKey: wl.awsSecretAccessKey,
          bucketName: wl.bucketName,
        }
      : undefined;
  }

  /**
   * Generates a presigned S3/R2 direct upload URL for lossless audio or cover artwork.
   * Scoped to the WhiteLabel tenant's BYOC S3 bucket when configured.
   */
  async getUploadUrl(whiteLabelId: string, dto: RequestUploadUrlDto) {
    const tenantConfig = await this.getTenantStorageConfig(whiteLabelId);
    const cleanFileName = dto.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folder = dto.type === 'AUDIO' ? 'audio' : 'artwork';
    const key = `catalog/${whiteLabelId}/${folder}/${Date.now()}-${cleanFileName}`;

    const uploadUrl = await this.storageService.getTenantPresignedUploadUrl(
      whiteLabelId,
      key,
      dto.mimeType,
      3600,
      tenantConfig,
    );

    return {
      uploadUrl,
      key,
      type: dto.type,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      bucket: tenantConfig?.bucketName || 'default',
    };
  }

  /**
   * Creates a new release draft.
   */
  async createReleaseDraft(
    whiteLabelId: string,
    whiteLabelUserId: string,
    dto: CreateReleaseDto,
  ) {
    const code = await generateUniqueCode(
      this.prisma,
      'release',
      CodePrefix.RELEASE,
    );

    const tenantConfig = await this.getTenantStorageConfig(whiteLabelId);
    let coverArtUrl: string | null = null;
    if (dto.coverArtKey) {
      coverArtUrl = tenantConfig?.bucketName
        ? `https://${tenantConfig.bucketName}.s3.${tenantConfig.awsRegion || 'ap-southeast-1'}.amazonaws.com/${dto.coverArtKey}`
        : this.storageService.getFileUrl(dto.coverArtKey);
    }

    const release = await this.prisma.release.create({
      data: {
        code,
        title: dto.title,
        type: dto.type,
        genre: dto.genre,
        subgenre: dto.subgenre,
        upc: dto.upc,
        catalogNumber: dto.catalogNumber,
        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : null,
        originalReleaseDate: dto.originalReleaseDate
          ? new Date(dto.originalReleaseDate)
          : null,
        labelName: dto.labelName,
        cLine: dto.cLine,
        pLine: dto.pLine,
        coverArtKey: dto.coverArtKey,
        coverArtUrl,
        videoUrl: dto.videoUrl,
        videoVersion: dto.videoVersion,
        vevoChannelName: dto.vevoChannelName,
        status: ReleaseStatus.DRAFT,
        whiteLabelId,
        whiteLabelUserId,
        contributors: dto.contributors?.length
          ? {
              create: dto.contributors.map((c) => ({
                name: c.name,
                role: c.role,
                spotifyId: c.spotifyId,
                appleMusicId: c.appleMusicId,
              })),
            }
          : undefined,
      },
      include: {
        contributors: true,
        tracks: true,
      },
    });

    return release;
  }

  /**
   * Lists all releases for the active WhiteLabel tenant.
   */
  async getReleases(whiteLabelId: string, query: QueryReleaseDto) {
    const { status, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      whiteLabelId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { upc: { contains: search, mode: 'insensitive' } },
        { genre: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.release.count({ where }),
      this.prisma.release.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contributors: true,
          _count: {
            select: { tracks: true },
          },
        },
      }),
    ]);

    const tenantConfig = await this.getTenantStorageConfig(whiteLabelId);

    // Enhance items with cover art preview URLs if stored privately
    const enhancedItems = await Promise.all(
      items.map(async (r) => {
        let presignedCoverUrl = r.coverArtUrl;
        if (r.coverArtKey) {
          try {
            presignedCoverUrl = await this.storageService.getTenantPresignedUrl(
              whiteLabelId,
              r.coverArtKey,
              3600,
              tenantConfig,
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
      data: enhancedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single release details with all tracks and contributors.
   */
  async getReleaseByCode(whiteLabelId: string, code: string) {
    const release = await this.prisma.release.findFirst({
      where: {
        code,
        whiteLabelId,
      },
      include: {
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
      throw new NotFoundException(`Release ${code} not found for this tenant`);
    }

    const tenantConfig = await this.getTenantStorageConfig(whiteLabelId);
    let presignedCoverUrl = release.coverArtUrl;
    if (release.coverArtKey) {
      try {
        presignedCoverUrl = await this.storageService.getTenantPresignedUrl(
          whiteLabelId,
          release.coverArtKey,
          3600,
          tenantConfig,
        );
      } catch {
        presignedCoverUrl = release.coverArtUrl;
      }
    }

    return {
      ...release,
      presignedCoverUrl,
    };
  }

  /**
   * Updates release metadata (allowed for DRAFT or REJECTED status).
   */
  async updateRelease(
    whiteLabelId: string,
    code: string,
    dto: UpdateReleaseDto,
  ) {
    const existing = await this.prisma.release.findFirst({
      where: { code, whiteLabelId },
    });

    if (!existing) {
      throw new NotFoundException(`Release ${code} not found`);
    }

    if (
      existing.status !== ReleaseStatus.DRAFT &&
      existing.status !== ReleaseStatus.REJECTED
    ) {
      throw new ForbiddenException(
        `Cannot edit release in ${existing.status} status`,
      );
    }

    if (existing.isLocked) {
      throw new ForbiddenException(
        'Cannot edit a locked release. Contact administrator for unlock.',
      );
    }

    const tenantConfig = await this.getTenantStorageConfig(whiteLabelId);
    let coverArtUrl = existing.coverArtUrl;
    if (dto.coverArtKey) {
      coverArtUrl = tenantConfig?.bucketName
        ? `https://${tenantConfig.bucketName}.s3.${tenantConfig.awsRegion || 'ap-southeast-1'}.amazonaws.com/${dto.coverArtKey}`
        : this.storageService.getFileUrl(dto.coverArtKey);
    }

    // Replace contributors if provided
    if (dto.contributors) {
      await this.prisma.releaseContributor.deleteMany({
        where: { releaseId: existing.id },
      });
    }

    const updated = await this.prisma.release.update({
      where: { id: existing.id },
      data: {
        title: dto.title ?? existing.title,
        type: dto.type ?? existing.type,
        genre: dto.genre ?? existing.genre,
        subgenre: dto.subgenre ?? existing.subgenre,
        upc: dto.upc ?? existing.upc,
        catalogNumber: dto.catalogNumber ?? existing.catalogNumber,
        releaseDate: dto.releaseDate
          ? new Date(dto.releaseDate)
          : existing.releaseDate,
        originalReleaseDate: dto.originalReleaseDate
          ? new Date(dto.originalReleaseDate)
          : existing.originalReleaseDate,
        labelName: dto.labelName ?? existing.labelName,
        cLine: dto.cLine ?? existing.cLine,
        pLine: dto.pLine ?? existing.pLine,
        coverArtKey: dto.coverArtKey ?? existing.coverArtKey,
        coverArtUrl,
        videoUrl: dto.videoUrl ?? existing.videoUrl,
        videoVersion: dto.videoVersion ?? existing.videoVersion,
        vevoChannelName: dto.vevoChannelName ?? existing.vevoChannelName,
        contributors: dto.contributors?.length
          ? {
              create: dto.contributors.map((c) => ({
                name: c.name,
                role: c.role,
                spotifyId: c.spotifyId,
                appleMusicId: c.appleMusicId,
              })),
            }
          : undefined,
      },
      include: {
        contributors: true,
        tracks: true,
      },
    });

    return updated;
  }

  /**
   * Adds a track to a release.
   */
  async addTrack(
    whiteLabelId: string,
    releaseCode: string,
    dto: CreateTrackDto,
  ) {
    const release = await this.prisma.release.findFirst({
      where: { code: releaseCode, whiteLabelId },
      include: { tracks: true },
    });

    if (!release) {
      throw new NotFoundException(`Release ${releaseCode} not found`);
    }

    if (
      release.status !== ReleaseStatus.DRAFT &&
      release.status !== ReleaseStatus.REJECTED
    ) {
      throw new ForbiddenException(
        `Cannot add tracks to release in ${release.status} status`,
      );
    }

    if (release.isLocked) {
      throw new ForbiddenException('Cannot add tracks to a locked release');
    }

    const trackCode = await generateUniqueCode(
      this.prisma,
      'track',
      CodePrefix.TRACK,
    );

    const trackNumber = dto.trackNumber || release.tracks.length + 1;
    const tenantStorage = await this.getTenantStorageConfig(whiteLabelId);
    const audioUrl = dto.audioKey
      ? tenantStorage
        ? `https://${tenantStorage.bucketName}.s3.${tenantStorage.awsRegion || 'ap-southeast-1'}.amazonaws.com/${dto.audioKey}`
        : this.storageService.getFileUrl(dto.audioKey)
      : null;

    const [track] = await this.prisma.$transaction([
      this.prisma.track.create({
        data: {
          code: trackCode,
          title: dto.title,
          trackNumber,
          discNumber: dto.discNumber || 1,
          version: dto.version,
          isrc: dto.isrc,
          iswc: dto.iswc,
          durationSeconds: dto.durationSeconds,
          explicit: dto.explicit || false,
          audioKey: dto.audioKey,
          audioUrl,
          fileName: dto.fileName,
          fileSizeBytes: dto.fileSizeBytes,
          mimeType: dto.mimeType,
          lyrics: dto.lyrics,
          language: dto.language || 'en',
          releaseId: release.id,
          contributors: dto.contributors?.length
            ? {
                create: dto.contributors.map((c) => ({
                  name: c.name,
                  role: c.role,
                  spotifyId: c.spotifyId,
                  appleMusicId: c.appleMusicId,
                })),
              }
            : undefined,
        },
        include: {
          contributors: true,
        },
      }),
      this.prisma.whiteLabel.update({
        where: { id: whiteLabelId },
        data: {
          catalogTrackCount: { increment: 1 },
        },
      }),
    ]);

    // Asynchronously trigger ACRCloud audio fingerprinting scan if audio file is present
    if (track.audioKey) {
      this.acrCloudService
        .scanTrack(track.id)
        .catch((err) =>
          this.logger.error(
            `Background audio scan failed for track ${track.code}: ${err.message}`,
          ),
        );
    }

    return track;
  }

  /**
   * Updates an existing track.
   */
  async updateTrack(
    whiteLabelId: string,
    releaseCode: string,
    trackCode: string,
    dto: UpdateTrackDto,
  ) {
    const release = await this.prisma.release.findFirst({
      where: { code: releaseCode, whiteLabelId },
    });

    if (!release) {
      throw new NotFoundException(`Release ${releaseCode} not found`);
    }

    if (
      release.status !== ReleaseStatus.DRAFT &&
      release.status !== ReleaseStatus.REJECTED
    ) {
      throw new ForbiddenException(
        `Cannot update tracks in ${release.status} status`,
      );
    }

    if (release.isLocked) {
      throw new ForbiddenException('Cannot update tracks in a locked release');
    }

    const track = await this.prisma.track.findFirst({
      where: { code: trackCode, releaseId: release.id },
    });

    if (!track) {
      throw new NotFoundException(`Track ${trackCode} not found in release`);
    }

    if (dto.contributors) {
      await this.prisma.trackContributor.deleteMany({
        where: { trackId: track.id },
      });
    }

    const tenantStorage = await this.getTenantStorageConfig(whiteLabelId);
    const audioUrl = dto.audioKey
      ? tenantStorage
        ? `https://${tenantStorage.bucketName}.s3.${tenantStorage.awsRegion || 'ap-southeast-1'}.amazonaws.com/${dto.audioKey}`
        : this.storageService.getFileUrl(dto.audioKey)
      : track.audioUrl;

    const updated = await this.prisma.track.update({
      where: { id: track.id },
      data: {
        title: dto.title ?? track.title,
        trackNumber: dto.trackNumber ?? track.trackNumber,
        discNumber: dto.discNumber ?? track.discNumber,
        version: dto.version ?? track.version,
        isrc: dto.isrc ?? track.isrc,
        iswc: dto.iswc ?? track.iswc,
        durationSeconds: dto.durationSeconds ?? track.durationSeconds,
        explicit: dto.explicit ?? track.explicit,
        audioKey: dto.audioKey ?? track.audioKey,
        audioUrl,
        fileName: dto.fileName ?? track.fileName,
        fileSizeBytes: dto.fileSizeBytes ?? track.fileSizeBytes,
        mimeType: dto.mimeType ?? track.mimeType,
        lyrics: dto.lyrics ?? track.lyrics,
        language: dto.language ?? track.language,
        contributors: dto.contributors?.length
          ? {
              create: dto.contributors.map((c) => ({
                name: c.name,
                role: c.role,
                spotifyId: c.spotifyId,
                appleMusicId: c.appleMusicId,
              })),
            }
          : undefined,
      },
      include: {
        contributors: true,
      },
    });

    // If audio key changed, trigger fresh audio scan
    if (updated.audioKey && updated.audioKey !== track.audioKey) {
      this.acrCloudService
        .scanTrack(updated.id)
        .catch((err) =>
          this.logger.error(
            `Background audio re-scan failed for track ${updated.code}: ${err.message}`,
          ),
        );
    }

    return updated;
  }

  /**
   * Deletes a track from a release.
   */
  async deleteTrack(
    whiteLabelId: string,
    releaseCode: string,
    trackCode: string,
  ) {
    const release = await this.prisma.release.findFirst({
      where: { code: releaseCode, whiteLabelId },
    });

    if (!release) {
      throw new NotFoundException(`Release ${releaseCode} not found`);
    }

    if (
      release.status !== ReleaseStatus.DRAFT &&
      release.status !== ReleaseStatus.REJECTED
    ) {
      throw new ForbiddenException(
        `Cannot delete tracks from release in ${release.status} status`,
      );
    }

    if (release.isLocked) {
      throw new ForbiddenException('Cannot delete tracks from a locked release');
    }

    const track = await this.prisma.track.findFirst({
      where: { code: trackCode, releaseId: release.id },
    });

    if (!track) {
      throw new NotFoundException(`Track ${trackCode} not found in release`);
    }

    await this.prisma.$transaction([
      this.prisma.track.delete({
        where: { id: track.id },
      }),
      this.prisma.whiteLabel.update({
        where: { id: whiteLabelId },
        data: {
          catalogTrackCount: { decrement: 1 },
        },
      }),
    ]);

    if (track.audioKey) {
      try {
        const tenantStorage = await this.getTenantStorageConfig(whiteLabelId);
        if (tenantStorage) {
          await this.storageService.deleteTenantFile(
            whiteLabelId,
            track.audioKey,
            tenantStorage,
          );
        } else {
          await this.storageService.deleteFile(track.audioKey);
        }
      } catch {
        // Non-blocking cleanup
      }
    }

    return { success: true, message: `Track ${trackCode} deleted` };
  }

  /**
   * Submits a release for Mother Company review and DSP distribution.
   */
  async submitRelease(whiteLabelId: string, releaseCode: string) {
    const release = await this.prisma.release.findFirst({
      where: { code: releaseCode, whiteLabelId },
      include: { tracks: true },
    });

    if (!release) {
      throw new NotFoundException(`Release ${releaseCode} not found`);
    }

    if (
      release.status !== ReleaseStatus.DRAFT &&
      release.status !== ReleaseStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Release is already in status ${release.status}`,
      );
    }

    if (!release.tracks.length) {
      throw new BadRequestException(
        'Release must contain at least 1 track before submission',
      );
    }

    if (!release.coverArtKey) {
      throw new BadRequestException(
        'Release must have cover artwork uploaded before submission',
      );
    }

    const missingAudio = release.tracks.some((t) => !t.audioKey);
    if (missingAudio) {
      throw new BadRequestException(
        'All tracks must have lossless audio uploaded before submission',
      );
    }

    // Execute Two-Tier Quality Control validation
    const qcResult = await this.qcValidationService.validateRelease(
      whiteLabelId,
      releaseCode,
    );
    if (!qcResult.isValid || (qcResult.errors && qcResult.errors.length > 0)) {
      throw new BadRequestException({
        message:
          'Release failed pre-flight Quality Control (Severity 1 Blocking Errors)',
        errors: qcResult.errors,
      });
    }

    const updated = await this.prisma.release.update({
      where: { id: release.id },
      data: {
        status: ReleaseStatus.SUBMITTED,
        submittedAt: new Date(),
        rejectionReason: null,
        isLocked: true,
        qcStatus:
          qcResult.severity2Warnings.length > 0
            ? QcStatus.FAILED_WARNINGS
            : QcStatus.PASSED,
      },
      include: {
        tracks: true,
        contributors: true,
      },
    });

    // Also lock all tracks in release
    if (typeof this.prisma.track?.updateMany === 'function') {
      await this.prisma.track.updateMany({
        where: { releaseId: release.id },
        data: { isLocked: true },
      });
    }

    // Trigger fingerprint scan on all tracks with audio upon submission
    for (const t of release.tracks) {
      if (t.audioKey) {
        this.acrCloudService
          .scanTrack(t.id)
          .catch((err) =>
            this.logger.error(
              `Submission audio scan error for track ${t.code}: ${err.message}`,
            ),
          );
      }
    }

    // Zero-Touch Automation: Auto-dispatch to ANS Music upstream immediately
    let autoDispatchResult: any = null;
    try {
      autoDispatchResult = await this.ansDispatchService.autoDispatchRelease(
        release.code,
      );
    } catch (dispatchErr: any) {
      this.logger.warn(
        `Auto-dispatch for release ${release.code} queued/failed: ${dispatchErr.message}. Release remains in SUBMITTED state.`,
      );
    }

    return {
      success: true,
      message:
        'Release submitted successfully to Mother Company for DSP distribution!',
      release: autoDispatchResult?.release || updated,
      dispatched: !!autoDispatchResult?.success,
    };
  }

  /**
   * Generates a presigned audio stream/download URL for in-app preview.
   */
  async getAudioPresignedUrl(whiteLabelId: string, trackCode: string) {
    const track = await this.prisma.track.findFirst({
      where: {
        code: trackCode,
        release: {
          whiteLabelId,
        },
      },
    });

    if (!track || !track.audioKey) {
      throw new NotFoundException(
        `Audio file for track ${trackCode} not found`,
      );
    }

    const tenantStorage = await this.getTenantStorageConfig(whiteLabelId);
    let url: string;
    if (tenantStorage) {
      url = await this.storageService.getTenantPresignedUrl(
        whiteLabelId,
        track.audioKey,
        3600,
        tenantStorage,
      );
    } else {
      url = await this.storageService.getPresignedUrl(track.audioKey, 3600);
    }

    return {
      trackCode: track.code,
      title: track.title,
      fileName: track.fileName,
      streamUrl: url,
    };
  }

  /**
   * Patches a release that received NEEDS_FIX or REJECTED status from upstream review.
   */
  async patchReleaseCorrection(
    whiteLabelId: string,
    releaseCode: string,
    dto: UpdateReleaseDto,
  ) {
    const release = await this.prisma.release.findFirst({
      where: { code: releaseCode, whiteLabelId },
    });

    if (!release) {
      throw new NotFoundException(`Release ${releaseCode} not found`);
    }

    // Unlock and update release fields
    const updated = await this.prisma.release.update({
      where: { id: release.id },
      data: {
        title: dto.title ?? release.title,
        genre: dto.genre ?? release.genre,
        subgenre: dto.subgenre ?? release.subgenre,
        cLine: dto.cLine ?? release.cLine,
        pLine: dto.pLine ?? release.pLine,
        videoUrl: dto.videoUrl ?? release.videoUrl,
        videoVersion: dto.videoVersion ?? release.videoVersion,
        vevoChannelName: dto.vevoChannelName ?? release.vevoChannelName,
        coverArtKey: dto.coverArtKey ?? release.coverArtKey,
        isLocked: false,
        rejectionReason: null,
      },
    });

    return {
      success: true,
      message: 'Release corrections saved successfully. You may now resubmit.',
      release: updated,
    };
  }

  /**
   * Requests a new VEVO channel for an artist under the WhiteLabel tenant.
   */
  async requestVevoChannel(
    whiteLabelId: string,
    whiteLabelUserId: string,
    dto: RequestVevoChannelDto,
  ) {
    const code = await generateUniqueCode(
      this.prisma,
      'vevoChannel',
      CodePrefix.VEVO_CHANNEL,
    );

    const channel = await this.prisma.vevoChannel.create({
      data: {
        code,
        channelName: dto.channelName,
        artistName: dto.artistName,
        description: dto.description,
        status: 'PENDING',
        whiteLabelId,
        whiteLabelUserId,
      },
    });

    // Zero-Touch Auto-Dispatch to ANS Music upstream
    try {
      await this.ansDispatchService.autoDispatchVevoChannel(channel.code);
    } catch (err: any) {
      this.logger.warn(
        `Auto-dispatch for VEVO channel ${channel.code} queued/failed: ${err.message}`,
      );
    }

    return {
      success: true,
      channel,
    };
  }

  /**
   * Lists all VEVO channels for a WhiteLabel tenant.
   */
  async listVevoChannels(whiteLabelId: string) {
    const channels = await this.prisma.vevoChannel.findMany({
      where: { whiteLabelId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      channels,
    };
  }
}
