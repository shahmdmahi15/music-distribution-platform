import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { WhitelabelBundleService } from 'src/platform/client/whitelabel/bundle/whitelabel-bundle.service';
import {
  WhitelabelTelemetryDto,
  WhitelabelUpdateStatus,
} from './dto/whitelabel-telemetry.dto';

@Injectable()
export class WhitelabelSystemService {
  private readonly logger = new Logger(WhitelabelSystemService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bundleService: WhitelabelBundleService,
  ) {}

  /**
   * Retrieves latest available version manifest and compares against tenant's active version.
   */
  async getVersionManifest(whiteLabelId: string) {
    const manifest = this.bundleService.getVersionManifest();

    const tenant = await this.prisma.whiteLabel.findUnique({
      where: { id: whiteLabelId },
      select: {
        id: true,
        name: true,
        code: true,
        installedVersion: true,
        installedCommitHash: true,
        lastUpdatedAt: true,
        updateStatus: true,
        autoUpdateEnabled: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`WhiteLabel ${whiteLabelId} not found.`);
    }

    // Update last checked timestamp
    await this.prisma.whiteLabel.update({
      where: { id: whiteLabelId },
      data: {
        lastUpdateCheckedAt: new Date(),
      },
    });

    const isUpdateAvailable =
      Boolean(tenant.installedVersion) &&
      (tenant.installedVersion !== manifest.version ||
        (Boolean(tenant.installedCommitHash) &&
          manifest.commitHash !== 'unknown' &&
          tenant.installedCommitHash !== manifest.commitHash));

    return {
      success: true,
      tenant: {
        code: tenant.code,
        name: tenant.name,
        installedVersion: tenant.installedVersion || '1.0.0',
        installedCommitHash: tenant.installedCommitHash,
        lastUpdatedAt: tenant.lastUpdatedAt,
        updateStatus: isUpdateAvailable ? 'UPDATE_AVAILABLE' : (tenant.updateStatus || 'UP_TO_DATE'),
        autoUpdateEnabled: tenant.autoUpdateEnabled ?? true,
      },
      latestRelease: {
        version: manifest.version,
        commitHash: manifest.commitHash,
        buildTime: manifest.buildTime,
        sha256: manifest.sha256,
        bundleSize: manifest.bundleSize,
        bundleSizeBytes: manifest.bundleSizeBytes,
      },
      updateAvailable: isUpdateAvailable,
      downloadUrl: '/whitelabel/system/bundle',
    };
  }

  /**
   * Records health and update telemetry sent by the customer's EC2 self-updater daemon.
   */
  async recordTelemetry(whiteLabelId: string, dto: WhitelabelTelemetryDto) {
    this.logger.log(
      `[Telemetry] WhiteLabel ${whiteLabelId}: Version=${dto.installedVersion}, Status=${dto.status}, Error=${dto.error || 'none'}`,
    );

    const isSuccess =
      dto.status === WhitelabelUpdateStatus.UPDATE_SUCCESS ||
      dto.status === WhitelabelUpdateStatus.UP_TO_DATE;

    const updated = await this.prisma.whiteLabel.update({
      where: { id: whiteLabelId },
      data: {
        installedVersion: dto.installedVersion,
        installedCommitHash: dto.commitHash || undefined,
        lastUpdateCheckedAt: new Date(),
        lastUpdatedAt: isSuccess ? new Date() : undefined,
        updateStatus: dto.status,
        updateError: dto.error ? dto.error.slice(0, 500) : null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        installedVersion: true,
        updateStatus: true,
      },
    });

    return {
      success: true,
      message: 'System telemetry recorded successfully.',
      tenant: updated,
    };
  }

  /**
   * Streams the distribution bundle directly to the tenant's EC2 instance.
   */
  async streamBundle(whiteLabelId: string, res: Response) {
    const bundlePath = this.bundleService.getBundleFilePath();
    const manifest = this.bundleService.getVersionManifest();

    this.logger.log(
      `[BundleDownload] Tenant ${whiteLabelId} downloading whitelabel.zip (${manifest.version})`,
    );

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('X-Bundle-Checksum-SHA256', manifest.sha256);
    res.setHeader('X-Bundle-Version', manifest.version);
    res.setHeader('X-Bundle-Commit', manifest.commitHash);
    res.setHeader('Content-Disposition', 'attachment; filename="whitelabel.zip"');

    return res.sendFile(bundlePath);
  }
}
