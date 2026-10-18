import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import {
  StorageService,
  TenantStorageConfig,
} from 'src/lib/storage/storage.service';
import {
  Prisma,
  ReleaseStatus,
  VevoChannelStatus,
} from 'src/generated/prisma/client';
import {
  QueryClientReleasesDto,
  RejectChannelDto,
  RejectReleaseDto,
} from './dto/client-catalog.dto';

@Injectable()
export class ClientCatalogService {
  private readonly logger = new Logger(ClientCatalogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Resolves the WhiteLabel tenant owned by the client platform user.
   */
  private async getWhiteLabelForUser(userId: string) {
    const whiteLabel = await this.prisma.whiteLabel.findFirst({
      where: {
        subscription: {
          subscriberId: userId,
        },
      },
    });

    if (!whiteLabel) {
      throw new NotFoundException(
        'WhiteLabel tenant not found for this client account',
      );
    }

    return whiteLabel;
  }

  /**
   * Resolves tenant BYOC S3 storage config if provisioned.
   */
  private getTenantStorageConfig(
    whiteLabel: any,
  ): TenantStorageConfig | undefined {
    return whiteLabel?.awsAccessKeyId &&
      whiteLabel?.awsSecretAccessKey &&
      whiteLabel?.bucketName
      ? {
          awsAccessKeyId: whiteLabel.awsAccessKeyId,
          awsSecretAccessKey: whiteLabel.awsSecretAccessKey,
          awsRegion: whiteLabel.awsRegion || 'ap-southeast-1',
          bucketName: whiteLabel.bucketName,
        }
      : undefined;
  }

  /**
   * Lists releases for this client's WhiteLabel with filtering, searching, and pagination.
   */
  async listReleases(userId: string, query: QueryClientReleasesDto) {
    const whiteLabel = await this.getWhiteLabelForUser(userId);
    const { status, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ReleaseWhereInput = {
      whiteLabelId: whiteLabel.id,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { labelName: { contains: search, mode: 'insensitive' } },
              { upc: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.release.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tracks: {
            orderBy: { trackNumber: 'asc' },
          },
          contributors: true,
          whiteLabelUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.release.count({ where }),
    ]);

    return {
      success: true,
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Detailed release dossier including audio presigned URLs, artwork, and QC results.
   */
  async getRelease(userId: string, code: string) {
    const whiteLabel = await this.getWhiteLabelForUser(userId);
    const tenantStorage = this.getTenantStorageConfig(whiteLabel);

    const release = await this.prisma.release.findFirst({
      where: { code, whiteLabelId: whiteLabel.id },
      include: {
        tracks: {
          orderBy: { trackNumber: 'asc' },
          include: {
            contributors: true,
            audioScan: true,
          },
        },
        contributors: true,
        whiteLabelUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        deliveryPackages: true,
      },
    });

    if (!release) {
      throw new NotFoundException(`Release ${code} not found in your catalog`);
    }

    // Generate cover art presigned URL if key exists
    let coverUrl = release.coverArtUrl;
    if (release.coverArtKey) {
      try {
        coverUrl = await this.storage.getTenantPresignedUrl(
          whiteLabel.id,
          release.coverArtKey,
          3600,
          tenantStorage,
        );
      } catch (err: any) {
        this.logger.warn(`Failed generating cover art URL: ${err.message}`);
      }
    }

    // Generate presigned audio URLs for tracks
    const tracksWithUrls = await Promise.all(
      release.tracks.map(async (t) => {
        let presignedAudioUrl: string | null = null;
        if (t.audioKey) {
          try {
            presignedAudioUrl = await this.storage.getTenantPresignedUrl(
              whiteLabel.id,
              t.audioKey,
              3600,
              tenantStorage,
            );
          } catch (err: any) {
            this.logger.warn(
              `Failed generating audio URL for track ${t.code}: ${err.message}`,
            );
          }
        }
        return {
          ...t,
          presignedAudioUrl,
          audioDownloadUrl: presignedAudioUrl || t.audioUrl,
        };
      }),
    );

    return {
      success: true,
      release: {
        ...release,
        coverArtUrl: coverUrl,
        presignedCoverUrl: coverUrl,
        tracks: tracksWithUrls,
      },
    };
  }

  /**
   * Approves release: SUBMITTED -> CLIENT_APPROVED (Queued for Platform Admin dispatch).
   */
  async approveRelease(userId: string, code: string, notes?: string) {
    const whiteLabel = await this.getWhiteLabelForUser(userId);

    const release = await this.prisma.release.findFirst({
      where: { code, whiteLabelId: whiteLabel.id },
    });

    if (!release) {
      throw new NotFoundException(`Release ${code} not found in your catalog`);
    }

    if (release.status !== ReleaseStatus.SUBMITTED) {
      throw new BadRequestException(
        `Only releases in SUBMITTED status can be approved. Current status: ${release.status}`,
      );
    }

    const updated = await this.prisma.release.update({
      where: { id: release.id },
      data: {
        status: ReleaseStatus.CLIENT_APPROVED,
        rejectionReason: null,
        ...(notes ? { adminNotes: notes } : {}),
      },
    });

    this.logger.log(
      `Release ${code} approved by WhiteLabel Owner (${userId}) -> CLIENT_APPROVED`,
    );

    return {
      success: true,
      message:
        'Release approved successfully. It is now queued for Platform Admin dispatch.',
      release: updated,
    };
  }

  /**
   * Rejects release: Transitions to NEEDS_FIX with feedback, unlocks tracks for artist correction.
   */
  async rejectRelease(userId: string, code: string, dto: RejectReleaseDto) {
    const whiteLabel = await this.getWhiteLabelForUser(userId);

    const release = await this.prisma.release.findFirst({
      where: { code, whiteLabelId: whiteLabel.id },
    });

    if (!release) {
      throw new NotFoundException(`Release ${code} not found in your catalog`);
    }

    if (
      release.status !== ReleaseStatus.SUBMITTED &&
      release.status !== ReleaseStatus.CLIENT_APPROVED
    ) {
      throw new BadRequestException(
        `Cannot reject release in ${release.status} status`,
      );
    }

    const updated = await this.prisma.release.update({
      where: { id: release.id },
      data: {
        status: ReleaseStatus.NEEDS_FIX,
        isLocked: false,
        rejectionReason: dto.reason,
        upstreamReason: dto.reason,
      },
    });

    // Unlock tracks so artist can update and re-upload files
    await this.prisma.track.updateMany({
      where: { releaseId: release.id },
      data: { isLocked: false },
    });

    this.logger.log(
      `Release ${code} sent back with NEEDS_FIX by WhiteLabel Owner (${userId}): ${dto.reason}`,
    );

    return {
      success: true,
      message: 'Release sent back to artist with corrections requested.',
      release: updated,
    };
  }

  /**
   * Lists VEVO channel requests for this client's WhiteLabel.
   */
  async listChannels(userId: string) {
    const whiteLabel = await this.getWhiteLabelForUser(userId);

    const channels = await this.prisma.vevoChannel.findMany({
      where: { whiteLabelId: whiteLabel.id },
      orderBy: { createdAt: 'desc' },
      include: {
        whiteLabelUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      channels,
    };
  }

  /**
   * Approves VEVO channel: REQUESTED -> CLIENT_APPROVED.
   */
  async approveChannel(userId: string, code: string) {
    const whiteLabel = await this.getWhiteLabelForUser(userId);

    const channel = await this.prisma.vevoChannel.findFirst({
      where: { code, whiteLabelId: whiteLabel.id },
    });

    if (!channel) {
      throw new NotFoundException(`VEVO Channel ${code} not found`);
    }

    if (
      channel.status !== VevoChannelStatus.REQUESTED &&
      channel.status !== VevoChannelStatus.PENDING
    ) {
      throw new BadRequestException(
        `Cannot approve channel in ${channel.status} status`,
      );
    }

    const updated = await this.prisma.vevoChannel.update({
      where: { id: channel.id },
      data: {
        status: VevoChannelStatus.CLIENT_APPROVED,
      },
    });

    return {
      success: true,
      message: 'Channel request approved by WhiteLabel Owner.',
      channel: updated,
    };
  }

  /**
   * Rejects VEVO channel: Transitions to REJECTED.
   */
  async rejectChannel(userId: string, code: string, dto: RejectChannelDto) {
    const whiteLabel = await this.getWhiteLabelForUser(userId);

    const channel = await this.prisma.vevoChannel.findFirst({
      where: { code, whiteLabelId: whiteLabel.id },
    });

    if (!channel) {
      throw new NotFoundException(`VEVO Channel ${code} not found`);
    }

    const updated = await this.prisma.vevoChannel.update({
      where: { id: channel.id },
      data: {
        status: VevoChannelStatus.REJECTED,
      },
    });

    return {
      success: true,
      message: `Channel request rejected: ${dto.reason}`,
      channel: updated,
    };
  }
}
