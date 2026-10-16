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
  QcStatus,
  ReleaseStatus,
  ReleaseType,
  UpstreamProvider,
  UpstreamStatus,
  VevoChannelStatus,
} from 'src/generated/prisma/client';
import {
  AnsContributorInput,
  AnsReleaseInput,
  AnsTrackInput,
} from 'src/lib/ans-music/ans-music.types';

@Injectable()
export class AnsDispatchService {
  private readonly logger = new Logger(AnsDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly ansClient: AnsMusicClientService,
  ) {}

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

    if (release.isLocked || release.status === ReleaseStatus.DISTRIBUTED) {
      throw new ConflictException(
        `Release ${release.code} is already locked or distributed`,
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

    // Resolve cover art URL
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

    // Map tracks and audio URLs
    const mappedTracks: AnsTrackInput[] = [];
    for (const track of release.tracks) {
      let audioUrl = track.audioUrl || '';
      if (!audioUrl && track.audioKey) {
        audioUrl = await this.storage.getTenantPresignedUrl(
          release.whiteLabelId,
          track.audioKey,
          3600 * 24,
          tenantStorageConfig,
        );
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

    const releaseContributors: AnsContributorInput[] = (
      release.contributors || []
    ).map((c) => ({
      name: c.name,
      role: c.role,
    }));

    if (
      releaseContributors.length === 0 &&
      release.tracks[0]?.contributors?.length
    ) {
      releaseContributors.push(...mappedTracks[0].contributors);
    }

    const releaseTypeMapped =
      release.type === ReleaseType.MUSIC_VIDEO ? 'MUSIC_VIDEO' : release.type;

    const dispatchPayload: AnsReleaseInput = {
      externalId: release.code,
      title: release.title,
      type: releaseTypeMapped,
      genre: release.genre || 'Pop',
      subgenre: release.subgenre || undefined,
      releaseDate: release.releaseDate
        ? release.releaseDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      cLine: release.cLine || 'RoyalMotion IT',
      pLine: release.pLine || 'RoyalMotion IT',
      upc: release.upc || undefined,
      coverArtUrl: coverUrl,
      channel: release.vevoChannelName || undefined,
      videoUrl: release.videoUrl || undefined,
      videoVersion: (release.videoVersion as any) || undefined,
      tracks: mappedTracks,
      contributors: releaseContributors,
    };

    this.logger.log(
      `Zero-Touch Dispatch: Dispatching release ${release.code} to ANS Music upstream...`,
    );

    // Call ANS Music API
    const ansResponse = await this.ansClient.createRelease(dispatchPayload);

    // Update release in database
    const updatedRelease = await this.prisma.release.update({
      where: { id: release.id },
      data: {
        status: ReleaseStatus.DISTRIBUTED,
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

    // Update track ISRCs if returned
    if (ansResponse.tracks && Array.isArray(ansResponse.tracks)) {
      for (const t of ansResponse.tracks) {
        if (t.externalId && t.isrc) {
          await this.prisma.track.updateMany({
            where: { code: t.externalId, releaseId: release.id },
            data: { isrc: t.isrc },
          });
        }
      }
    }

    this.logger.log(
      `Zero-Touch Dispatch: Successfully dispatched release ${release.code} to ANS Music (ID: ${ansResponse.id})`,
    );

    return {
      success: true,
      releaseCode: release.code,
      ansReleaseId: ansResponse.id,
      ansResponse,
      release: updatedRelease,
    };
  }

  async autoDispatchVevoChannel(channelCodeOrId: string) {
    const channel = await this.prisma.vevoChannel.findFirst({
      where: {
        OR: [{ id: channelCodeOrId }, { code: channelCodeOrId }],
      },
    });

    if (!channel) {
      throw new NotFoundException(`VEVO Channel ${channelCodeOrId} not found`);
    }

    if (
      channel.status === VevoChannelStatus.APPROVED ||
      channel.status === VevoChannelStatus.SUBMITTED
    ) {
      throw new ConflictException(
        `Channel request ${channel.code} is already approved or submitted`,
      );
    }

    const ansChan = await this.ansClient.requestChannel({
      externalId: channel.code,
      channelName: channel.channelName,
      artistName: channel.artistName || channel.channelName,
      artistBio: channel.description || undefined,
    });

    await this.prisma.vevoChannel.update({
      where: { id: channel.id },
      data: {
        status: VevoChannelStatus.SUBMITTED,
        upstreamChannelId: ansChan.id,
      },
    });

    return {
      success: true,
      channelCode: channel.code,
      ansChannelId: ansChan.id,
      ansChannel: ansChan,
    };
  }
}
