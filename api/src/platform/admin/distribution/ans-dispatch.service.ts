import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import {
  StorageService,
  TenantStorageConfig,
} from 'src/lib/storage/storage.service';
import { AnsMusicClientService } from 'src/lib/ans-music/ans-music-client.service';
import {
  ContributorRole,
  QcStatus,
  ReleaseStatus,
  UpstreamProvider,
  UpstreamStatus,
  VevoChannelStatus,
} from 'src/generated/prisma/client';
import {
  AnsChannelRequest,
  AnsReleaseInput,
  AnsTrackInput,
  AnsVideoVersion,
} from 'src/lib/ans-music/ans-music.types';

@Injectable()
export class AnsDispatchService {
  private readonly logger = new Logger(AnsDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly ansClient: AnsMusicClientService,
  ) {}

  /**
   * Dispatches release to ANS Music upstream.
   * Supports releases with status CLIENT_APPROVED or SUBMITTED.
   */
  async autoDispatchRelease(codeOrId: string) {
    const release = await this.prisma.release.findFirst({
      where: {
        OR: [{ id: codeOrId }, { code: codeOrId }],
      },
      include: {
        whiteLabel: true,
        contributors: true,
        tracks: {
          orderBy: { trackNumber: 'asc' },
          include: {
            contributors: true,
            audioScan: true,
          },
        },
      },
    });

    if (!release) {
      throw new NotFoundException(`Release ${codeOrId} not found`);
    }

    if (release.status === ReleaseStatus.DISTRIBUTED) {
      throw new ConflictException(
        `Release ${release.code} is already distributed`,
      );
    }

    if (
      release.status !== ReleaseStatus.CLIENT_APPROVED &&
      release.status !== ReleaseStatus.SUBMITTED
    ) {
      throw new BadRequestException(
        `Release ${release.code} is in status ${release.status}. Only CLIENT_APPROVED or SUBMITTED releases can be dispatched.`,
      );
    }

    if (release.qcStatus === QcStatus.FAILED_BLOCKING) {
      throw new BadRequestException(
        `Release ${release.code} has blocking QC validation errors: ${JSON.stringify(release.validationErrors || [])}`,
      );
    }

    if (!release.tracks || release.tracks.length === 0) {
      throw new BadRequestException(
        `Release ${release.code} has 0 tracks; cannot dispatch to DSP upstream`,
      );
    }

    // Resolve tenant BYOC storage configuration if provisioned
    const tenantStorageConfig: TenantStorageConfig | undefined =
      release.whiteLabel?.awsAccessKeyId &&
      release.whiteLabel?.awsSecretAccessKey &&
      release.whiteLabel?.bucketName
        ? {
            awsAccessKeyId: release.whiteLabel.awsAccessKeyId,
            awsSecretAccessKey: release.whiteLabel.awsSecretAccessKey,
            awsRegion: release.whiteLabel.awsRegion || 'ap-southeast-1',
            bucketName: release.whiteLabel.bucketName,
          }
        : undefined;

    // Resolve cover art URL (Direct S3 presigned URL)
    let coverUrl = release.coverArtUrl || '';
    if (!coverUrl && release.coverArtKey) {
      coverUrl = await this.storage.getTenantPresignedUrl(
        release.whiteLabelId,
        release.coverArtKey,
        3600 * 24,
        tenantStorageConfig,
      );
    }
    if (!coverUrl) {
      coverUrl = 'https://storage.royalmotionit.com/defaults/cover.jpg';
    }

    // Resolve video URL from videoUrl field or first track audio/video key
    let videoUrl = release.videoUrl || '';
    if (!videoUrl && release.tracks[0]?.audioKey) {
      videoUrl = await this.storage.getTenantPresignedUrl(
        release.whiteLabelId,
        release.tracks[0].audioKey,
        3600 * 24,
        tenantStorageConfig,
      );
    }
    if (!videoUrl) {
      videoUrl = release.tracks[0]?.audioUrl || coverUrl;
    }

    // Resolve Primary and Featuring Artists
    const primaryArtists = (release.contributors || [])
      .filter((c) => c.role === ContributorRole.PRIMARY_ARTIST)
      .map((c) => c.name);

    if (primaryArtists.length === 0 && release.tracks[0]?.contributors?.length) {
      primaryArtists.push(
        ...release.tracks[0].contributors
          .filter((c) => c.role === ContributorRole.PRIMARY_ARTIST)
          .map((c) => c.name),
      );
    }
    if (primaryArtists.length === 0) {
      primaryArtists.push(release.title);
    }

    const featuringArtists = (release.contributors || [])
      .filter((c) => c.role === ContributorRole.FEATURED_ARTIST)
      .map((c) => c.name);

    const versionMapped: AnsVideoVersion = release.videoVersion
      ? (release.videoVersion.toLowerCase() as AnsVideoVersion)
      : 'official';

    // Map tracks and audio URLs for optional tracks payload
    const mappedTracks: AnsTrackInput[] = [];
    for (const track of release.tracks) {
      let audioUrl = track.audioUrl || '';
      if (!audioUrl && track.audioKey) {
        try {
          audioUrl = await this.storage.getTenantPresignedUrl(
            release.whiteLabelId,
            track.audioKey,
            3600 * 24,
            tenantStorageConfig,
          );
        } catch {
          audioUrl = '';
        }
      }

      mappedTracks.push({
        externalId: track.code,
        trackNumber: track.trackNumber,
        discNumber: track.discNumber || 1,
        title: track.title,
        version: track.version || undefined,
        durationSeconds: track.durationSeconds || 180,
        audioUrl: audioUrl || undefined,
        isrc: track.isrc || undefined,
        explicit: Boolean(track.explicit),
        contributors: (track.contributors || []).map((c) => ({
          name: c.name,
          role: c.role,
        })),
      });
    }

    // Format strictly according to https://apidoc.ansmusic.io/
    // 9 mandatory fields + externalId + releaseDate + version + videoUrl + imageUrl
    const dispatchPayload: AnsReleaseInput = {
      title: release.title,
      primaryArtist: primaryArtists,
      videoUrl,
      imageUrl: coverUrl,
      label:
        release.labelName ||
        release.whiteLabel?.name ||
        'RoyalMotion Records',
      genre: [release.genre || 'Pop'],
      language: release.tracks[0]?.language || 'Bengali',
      description:
        release.adminNotes ||
        `Official music video for ${release.title} by ${primaryArtists.join(', ')}.`,
      channel: release.vevoChannelName || 'RoyalMotionVEVO',
      externalId: release.code,
      featuringArtists:
        featuringArtists.length > 0 ? featuringArtists : undefined,
      releaseDate: release.releaseDate
        ? release.releaseDate.toISOString()
        : new Date().toISOString(),
      version: versionMapped,
      upc: release.upc || undefined,
      isrc: release.tracks[0]?.isrc || undefined,
      visibility: 'public',
      tracks: mappedTracks,
    };

    this.logger.log(
      `Dispatching release ${release.code} to ANS Music API at /releases...`,
    );

    // Call upstream ANS Music API
    const ansResponse = await this.ansClient.createRelease(dispatchPayload);

    // Update release in database
    const updatedRelease = await this.prisma.release.update({
      where: { id: release.id },
      data: {
        status: ReleaseStatus.APPROVED,
        isLocked: true,
        distributedAt: new Date(),
        upstreamProvider: UpstreamProvider.ANS_MUSIC,
        upstreamReleaseId: ansResponse.id,
        upstreamVideoId: ansResponse.videoId || undefined,
        upstreamStatus: UpstreamStatus.PENDING,
        ...(ansResponse.upc && !release.upc
          ? { upc: ansResponse.upc, upcAssignedByUpstream: true }
          : {}),
      },
    });

    if (ansResponse.isrc && release.tracks[0] && !release.tracks[0].isrc) {
      await this.prisma.track.update({
        where: { id: release.tracks[0].id },
        data: { isrc: ansResponse.isrc },
      });
    }

    this.logger.log(
      `Dispatched release ${release.code} to ANS Music (ID: ${ansResponse.id}, VideoID: ${ansResponse.videoId})`,
    );

    return {
      success: true,
      releaseCode: release.code,
      ansReleaseId: ansResponse.id,
      ansResponse,
      release: updatedRelease,
    };
  }

  /**
   * Dispatches VEVO channel request to ANS Music: POST /channels
   */
  async autoDispatchVevoChannel(channelCodeOrId: string) {
    const channel = await this.prisma.vevoChannel.findFirst({
      where: {
        OR: [{ id: channelCodeOrId }, { code: channelCodeOrId }],
      },
    });

    if (!channel) {
      throw new NotFoundException(`VEVO Channel ${channelCodeOrId} not found`);
    }

    if (channel.status === VevoChannelStatus.APPROVED) {
      throw new ConflictException(
        `Channel request ${channel.code} is already approved`,
      );
    }

    const payload: AnsChannelRequest = {
      channelName: channel.channelName,
      artistName: channel.artistName || channel.channelName,
      description: channel.description || undefined,
      keywords: channel.keywords?.length ? channel.keywords : undefined,
    };

    const ansChan = await this.ansClient.requestChannel(payload);

    const updated = await this.prisma.vevoChannel.update({
      where: { id: channel.id },
      data: {
        status: VevoChannelStatus.DISPATCHED_TO_ANS,
        upstreamChannelId: ansChan.id,
      },
    });

    return {
      success: true,
      channelCode: channel.code,
      ansChannelId: ansChan.id,
      ansChannel: ansChan,
      channel: updated,
    };
  }
}
