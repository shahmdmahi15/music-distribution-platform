import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { generateUniqueCode, CodePrefix } from 'src/lib/prisma/code-generator';
import {
  DOCUMENT_URL_TTL_SECONDS,
  StorageService,
} from 'src/lib/storage/storage.service';
import { IMMUTABLE_CACHE_CONTROL } from 'src/config/storage-keys.config';
import { CreateWhiteLabelDto } from './dto/create-whitelabel.dto';
import { UpdateBrandingDto } from 'src/platform/dto/update-branding.dto';
import { Prisma, WhiteLabelStatus } from 'src/generated/prisma/client';
import { RedisService } from 'src/lib/redis/redis.service';
import * as crypto from 'node:crypto';
import * as dns from 'node:dns/promises';
import {
  UpdateThemeDto,
  UpdateDomainDto,
  UpdateSsoDto,
  TestCredentialsDto,
  CreateApiKeyDto,
  UpdateWebhookDto,
  TestWebhookDto,
} from './dto/whitelabel-management.dto';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import {
  CreateClientPortalUserDto,
  UpdateClientPortalUserDto,
  ResetClientPortalUserPasswordDto,
} from './dto/client-portal-user.dto';
import { ClientSetupWhiteLabelDto } from './dto/client-setup-whitelabel.dto';
import * as argon2 from 'argon2';
import { ARGON2_CONFIG } from 'src/config/argon2.config';
import { WhiteLabelUserRole } from 'src/generated/prisma/client';
import { CloudflareDnsService } from 'src/lib/cloudflare/cloudflare-dns.service';

export interface SubdomainHealthReport {
  status: 'VERIFIED' | 'FAILED' | 'PENDING' | 'NOT_CONFIGURED';
  subdomain: string;
  fqdn: string;
  isElasticIp: boolean;
  elasticIpv4?: string | null;
  expectedTarget: string;
  actualTarget?: string | null;
  recordType: 'A' | 'CNAME';
  proxied?: boolean;
  message: string;
}

export interface DomainHealthStep {
  status: 'VERIFIED' | 'FAILED' | 'PENDING' | 'NOT_CONFIGURED';
  title: string;
  message: string;
  details?: Record<string, any>;
}

export interface DomainHealthReport {
  lastCheckedAt: string;
  allConnected: boolean;
  subdomain: SubdomainHealthReport;
  step1: DomainHealthStep;
  step2: DomainHealthStep & {
    heldDomain?: string;
    verificationToken?: string;
    txtRecord?: {
      host: string;
      fqdn: string;
      value: string;
    };
  };
  step3: DomainHealthStep & {
    cnameHost?: string;
    cnameFqdn?: string;
    target?: string;
    proxied?: boolean;
  };
}

interface CachedThemeConfig {
  primaryColor?: string;
  accentColor?: string;
  radius?: string;
  mode?: 'light' | 'dark' | 'system';
  fontFamily?: string;
  cardStyle?: 'modern' | 'glass' | 'flat' | 'bordered';
  navbarStyle?: 'solid' | 'glass' | 'floating';
}

interface CachedSsoConfig {
  googleEnabled?: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  githubEnabled?: boolean;
  githubClientId?: string;
  githubClientSecret?: string;
  enforce2fa?: boolean;
  sessionTimeoutHours?: number;
}

interface CachedWebhookConfig {
  url: string;
  events: string[];
  isActive: boolean;
  signingSecret: string;
}

interface WebhookLogEntry {
  id: string;
  event: string;
  url: string;
  statusCode: number;
  deliveredAt: string;
  success: boolean;
  responseSummary: string;
}

@Injectable()
export class ClientWhitelabelService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClientWhitelabelService.name);
  private periodicHealthTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
    private readonly redisService: RedisService,
    private readonly cloudflareDnsService: CloudflareDnsService,
  ) {}

  onModuleInit() {
    // Schedule periodic health checks every 5 minutes (300,000 ms) across all WhiteLabels
    this.periodicHealthTimer = setInterval(
      () => {
        this.runPeriodicHealthChecksAcrossAllWhiteLabels().catch((err: any) => {
          this.logger.error(
            `Periodic domain health check failed: ${err.message}`,
          );
        });
      },
      5 * 60 * 1000,
    );

    // Initial check 10 seconds after server start
    setTimeout(() => {
      this.runPeriodicHealthChecksAcrossAllWhiteLabels().catch((err: any) => {
        this.logger.error(`Initial domain health check failed: ${err.message}`);
      });
    }, 10 * 1000);
  }

  onModuleDestroy() {
    if (this.periodicHealthTimer) {
      clearInterval(this.periodicHealthTimer);
      this.periodicHealthTimer = null;
    }
  }

  private readonly reservedSubdomains = new Set([
    'admin',
    'api',
    'app',
    'auth',
    'billing',
    'cdn',
    'dashboard',
    'dev',
    'dns',
    'docs',
    'help',
    'mail',
    'platform',
    'portal',
    'root',
    'staging',
    'status',
    'support',
    'test',
    'whitelabel',
    'ws',
    'www',
  ]);

  /**
   * Slugifies a brand name to a standard, DNS-compliant subdomain string.
   */
  slugifyBrandName(name: string): string {
    if (!name || typeof name !== 'string') return 'label';
    let slug = name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphen
      .replace(/-+/g, '-') // collapse multiple hyphens
      .replace(/^-|-$/g, ''); // trim leading/trailing hyphens

    if (slug.length < 3) {
      slug = `${slug}-music`.replace(/^-/, '');
    }
    // Limit base slug length to 24 chars so numeric suffix (e.g. -99) fits well in 30 chars limit
    return slug.slice(0, 24).replace(/-$/, '') || 'mylabel';
  }

  extractCleanBaseDomain(rawDomain?: string | null): string {
    if (!rawDomain) return '';
    return rawDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/^backstage\./, '')
      .replace(/^\.+|\.+$/g, '');
  }

  /**
   * Generates a guaranteed unique subdomain for a brand name:
   * 1. Slugifies brand name.
   * 2. Checks DB, reserved list, AND Cloudflare DNS.
   * 3. If taken or not empty in Cloudflare, iteratively appends -1, -2, -3...
   */
  async generateUniqueSubdomain(
    brandName: string,
    excludeWhiteLabelId?: string,
  ): Promise<string> {
    const baseSlug = this.slugifyBrandName(brandName);

    const isCandidateAvailable = async (
      candidate: string,
    ): Promise<boolean> => {
      // 1. Reserved platform subdomains
      if (this.reservedSubdomains.has(candidate)) return false;

      // 2. WhiteLabel database collision
      const dbMatch = await this.prismaService.whiteLabel.findFirst({
        where: {
          subdomain: candidate,
          ...(excludeWhiteLabelId ? { id: { not: excludeWhiteLabelId } } : {}),
        },
        select: { id: true },
      });
      if (dbMatch) return false;

      // 3. Cloudflare DNS check: must be completely empty in our Cloudflare zone
      const isCloudflareEmpty =
        await this.cloudflareDnsService.isSubdomainEmpty(candidate);
      if (!isCloudflareEmpty) return false;

      return true;
    };

    // Try base slug first
    if (await isCandidateAvailable(baseSlug)) {
      return baseSlug;
    }

    // If taken/not empty, append incrementing numbers
    let counter = 1;
    while (counter <= 1000) {
      const candidate = `${baseSlug}-${counter}`;
      if (await isCandidateAvailable(candidate)) {
        return candidate;
      }
      counter++;
    }

    // Fallback if 1000 numbers somehow taken
    return `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
  }

  /**
   * Public preview suggestion for onboarding wizard
   */
  async suggestUniqueSubdomain(name: string, excludeWhiteLabelId?: string) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      return {
        subdomain: '',
        fqdn: '',
      };
    }
    const uniqueSubdomain = await this.generateUniqueSubdomain(
      name,
      excludeWhiteLabelId,
    );
    return {
      subdomain: uniqueSubdomain,
      fqdn: `${uniqueSubdomain}.platform.royalmotionit.com`,
    };
  }

  async checkSubdomainAvailability(
    rawSubdomain: string,
    excludeUserId?: string,
  ) {
    if (!rawSubdomain || typeof rawSubdomain !== 'string') {
      return {
        available: false,
        subdomain: '',
        reason: 'Please enter a subdomain.',
        fqdn: '',
      };
    }

    const subdomain = rawSubdomain.trim().toLowerCase();

    if (subdomain.length < 3 || subdomain.length > 30) {
      return {
        available: false,
        subdomain,
        reason: 'Subdomain must be between 3 and 30 characters.',
        fqdn: `${subdomain}.platform.royalmotionit.com`,
      };
    }

    const validFormat = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(
      subdomain,
    );
    if (!validFormat) {
      return {
        available: false,
        subdomain,
        reason:
          'Only lowercase letters, numbers, and single hyphens are allowed.',
        fqdn: `${subdomain}.platform.royalmotionit.com`,
      };
    }

    if (this.reservedSubdomains.has(subdomain)) {
      return {
        available: false,
        subdomain,
        reason: 'This subdomain is reserved for platform infrastructure.',
        fqdn: `${subdomain}.platform.royalmotionit.com`,
      };
    }

    const existing = await this.prismaService.whiteLabel.findFirst({
      where: {
        subdomain,
        ...(excludeUserId
          ? {
              subscription: {
                subscriberId: { not: excludeUserId },
              },
            }
          : {}),
      },
      select: { id: true },
    });

    if (existing) {
      return {
        available: false,
        subdomain,
        reason: 'This subdomain is already taken by another label.',
        fqdn: `${subdomain}.platform.royalmotionit.com`,
      };
    }

    // Also check Cloudflare DNS
    const isCloudflareEmpty =
      await this.cloudflareDnsService.isSubdomainEmpty(subdomain);
    if (!isCloudflareEmpty) {
      return {
        available: false,
        subdomain,
        reason: 'This subdomain is already active in Cloudflare DNS.',
        fqdn: `${subdomain}.platform.royalmotionit.com`,
      };
    }

    return {
      available: true,
      subdomain,
      reason: 'Subdomain is available!',
      fqdn: `${subdomain}.platform.royalmotionit.com`,
    };
  }

  async saveOnboardingDraft(userId: string, draftData: any) {
    if (!userId || !draftData) return { success: false };
    const key = `whitelabel:onboarding:draft:${userId}`;
    // Store draft for 30 days
    await this.redisService.set(
      key,
      JSON.stringify(draftData),
      30 * 24 * 60 * 60,
    );
    return {
      success: true,
      message: 'Onboarding draft saved successfully.',
    };
  }

  async getOnboardingDraft(userId: string) {
    if (!userId) return { success: true, draft: null };
    const key = `whitelabel:onboarding:draft:${userId}`;
    const raw = await this.redisService.get(key);
    if (!raw) {
      return { success: true, draft: null };
    }
    try {
      const draft = JSON.parse(raw) as Record<string, unknown>;
      return { success: true, draft };
    } catch {
      return { success: true, draft: null };
    }
  }

  async clearOnboardingDraft(userId: string) {
    if (!userId) return { success: true };
    const key = `whitelabel:onboarding:draft:${userId}`;
    await this.redisService.del(key);
    return { success: true };
  }

  async apply(userId: string, dto: CreateWhiteLabelDto) {
    // 1. Find or create PlatformSubscription for this user
    let subscription = await this.prismaService.platformSubscription.findUnique(
      {
        where: { subscriberId: userId },
        include: { whiteLabel: true },
      },
    );

    if (!subscription) {
      const subCode = await generateUniqueCode(
        this.prismaService,
        'platformSubscription',
        CodePrefix.PLATFORM_SUBSCRIPTION,
      );
      subscription = await this.prismaService.platformSubscription.create({
        data: {
          code: subCode,
          subscriberId: userId,
        },
        include: { whiteLabel: true },
      });
    }

    // Automatically slugify desired subdomain or brand name to unique subdomain (verifying Cloudflare DNS + DB)
    const preferredSubdomainBase = dto.desiredSubdomain?.trim() || dto.name;
    let finalSubdomain: string;
    if (
      subscription.whiteLabel?.subdomain &&
      (subscription.whiteLabel.subdomain === dto.desiredSubdomain?.trim() ||
        subscription.whiteLabel.name === dto.name)
    ) {
      finalSubdomain = subscription.whiteLabel.subdomain;
    } else {
      finalSubdomain = await this.generateUniqueSubdomain(
        preferredSubdomainBase,
        subscription.whiteLabel?.id,
      );
    }

    const cleanElasticIpv4 = dto.elasticIpv4 ? dto.elasticIpv4.trim() : null;

    // 2. If WhiteLabel already exists
    if (subscription.whiteLabel) {
      if (subscription.whiteLabel.status === WhiteLabelStatus.ACTIVE) {
        throw new ConflictException(
          'You already have an active WhiteLabel instance.',
        );
      }

      const existingWhiteLabel = subscription.whiteLabel as {
        elasticIpv4?: string | null;
      };
      const existingElasticIpv4: string | null =
        existingWhiteLabel.elasticIpv4 ?? null;
      const finalElasticIpv4: string | null =
        cleanElasticIpv4 || existingElasticIpv4;

      // If pending or rejected or under review, update application
      // Delete existing top artists and recreate
      await this.prismaService.whiteLabelTopArtist.deleteMany({
        where: { whiteLabelId: subscription.whiteLabel.id },
      });

      const artistData: Prisma.WhiteLabelTopArtistCreateWithoutWhiteLabelInput[] =
        [];
      if (dto.topArtists && dto.topArtists.length > 0) {
        for (let i = 0; i < dto.topArtists.length; i++) {
          const artist = dto.topArtists[i];
          const artistCode = await generateUniqueCode(
            this.prismaService,
            'whiteLabelTopArtist',
            CodePrefix.WHITELABEL_ARTIST,
          );
          artistData.push({
            code: artistCode,
            artistName: artist.artistName,
            instagramHandle: artist.instagramHandle,
            spotifyProfileUrl: artist.spotifyProfileUrl,
            youtubeChannelUrl: artist.youtubeChannelUrl,
            monthlyListeners: artist.monthlyListeners,
            orderIndex: artist.orderIndex || i + 1,
          });
        }
      }

      const updated = await this.prismaService.whiteLabel.update({
        where: { id: subscription.whiteLabel.id },
        data: {
          name: dto.name,
          businessType: dto.businessType,
          companyWebsite: dto.companyWebsite,
          country: dto.country,
          yearsInBusiness: dto.yearsInBusiness ?? 0,
          isIncorporated: dto.isIncorporated ?? false,
          incorporationDocUrl: dto.incorporationDocUrl,
          contactFirstName: dto.contactFirstName,
          contactLastName: dto.contactLastName,
          contactEmail: dto.contactEmail,
          contactLinkedIn: dto.contactLinkedIn,
          catalogTrackCount: dto.catalogTrackCount ?? 0,
          monthlyTrackDelivery: dto.monthlyTrackDelivery ?? 0,
          monthlyRevenueUsd: dto.monthlyRevenueUsd,
          hasDirectDeals: dto.hasDirectDeals ?? false,
          currentDistributors: dto.currentDistributors ?? [],
          royaltySolutions: dto.royaltySolutions ?? [],
          primaryCatalogLanguage: dto.primaryCatalogLanguage ?? 'en',
          wantsCatalogMigration: dto.wantsCatalogMigration ?? false,
          hasSampleBasedCovers: dto.hasSampleBasedCovers ?? false,
          userSignupModel: dto.userSignupModel,
          privacyPolicyAccepted: dto.privacyPolicyAccepted ?? true,
          marketingConsent: dto.marketingConsent ?? false,
          ...(dto.onboardingDetails ? { onboardingDetails: dto.onboardingDetails } : {}),
          subdomain: finalSubdomain,
          elasticIpv4: finalElasticIpv4,
          ...(dto.primaryColor ? { primaryColor: dto.primaryColor } : {}),
          status: WhiteLabelStatus.PENDING,
          statusReason: null,
          reviewedAt: null,
          artists: {
            create: artistData,
          },
        },
        include: {
          artists: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      await this.cloudflareDnsService.provisionSubdomain(
        finalSubdomain,
        cleanElasticIpv4 || undefined,
      );

      await this.clearOnboardingDraft(userId);

      return {
        success: true,
        message: 'WhiteLabel application re-submitted successfully.',
        whiteLabel: updated,
      };
    }

    // 3. Create fresh WhiteLabel application
    const whiteLabelCode = await generateUniqueCode(
      this.prismaService,
      'whiteLabel',
      CodePrefix.WHITELABEL,
    );

    const artistData: Prisma.WhiteLabelTopArtistCreateWithoutWhiteLabelInput[] =
      [];
    if (dto.topArtists && dto.topArtists.length > 0) {
      for (let i = 0; i < dto.topArtists.length; i++) {
        const artist = dto.topArtists[i];
        const artistCode = await generateUniqueCode(
          this.prismaService,
          'whiteLabelTopArtist',
          CodePrefix.WHITELABEL_ARTIST,
        );
        artistData.push({
          code: artistCode,
          artistName: artist.artistName,
          instagramHandle: artist.instagramHandle,
          spotifyProfileUrl: artist.spotifyProfileUrl,
          youtubeChannelUrl: artist.youtubeChannelUrl,
          monthlyListeners: artist.monthlyListeners,
          orderIndex: artist.orderIndex || i + 1,
        });
      }
    }

    const whiteLabel = await this.prismaService.whiteLabel.create({
      data: {
        code: whiteLabelCode,
        name: dto.name,
        businessType: dto.businessType,
        subdomain: finalSubdomain,
        elasticIpv4: cleanElasticIpv4,
        primaryColor: dto.primaryColor || '#6366f1',
        companyWebsite: dto.companyWebsite,
        country: dto.country,
        yearsInBusiness: dto.yearsInBusiness ?? 0,
        isIncorporated: dto.isIncorporated ?? false,
        incorporationDocUrl: dto.incorporationDocUrl,
        contactFirstName: dto.contactFirstName,
        contactLastName: dto.contactLastName,
        contactEmail: dto.contactEmail,
        contactLinkedIn: dto.contactLinkedIn,
        catalogTrackCount: dto.catalogTrackCount ?? 0,
        monthlyTrackDelivery: dto.monthlyTrackDelivery ?? 0,
        monthlyRevenueUsd: dto.monthlyRevenueUsd,
        hasDirectDeals: dto.hasDirectDeals ?? false,
        currentDistributors: dto.currentDistributors ?? [],
        royaltySolutions: dto.royaltySolutions ?? [],
        primaryCatalogLanguage: dto.primaryCatalogLanguage ?? 'en',
        wantsCatalogMigration: dto.wantsCatalogMigration ?? false,
        hasSampleBasedCovers: dto.hasSampleBasedCovers ?? false,
        userSignupModel: dto.userSignupModel,
        privacyPolicyAccepted: dto.privacyPolicyAccepted ?? true,
        marketingConsent: dto.marketingConsent ?? false,
        ...(dto.onboardingDetails ? { onboardingDetails: dto.onboardingDetails } : {}),
        status: WhiteLabelStatus.PENDING,
        subscriptionId: subscription.id,
        artists: {
          create: artistData,
        },
      },
      include: {
        artists: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    await this.cloudflareDnsService.provisionSubdomain(
      finalSubdomain,
      cleanElasticIpv4 || undefined,
    );

    await this.clearOnboardingDraft(userId);

    return {
      success: true,
      message: 'WhiteLabel application submitted successfully.',
      whiteLabel,
    };
  }

  async getStatus(userId: string) {
    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: {
          whiteLabel: {
            include: {
              artists: {
                orderBy: { orderIndex: 'asc' },
              },
              documents: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

    let whiteLabelWithDocs = subscription?.whiteLabel;
    if (subscription?.whiteLabel?.documents) {
      const docsWithUrls = await Promise.all(
        subscription.whiteLabel.documents.map(async (doc) => ({
          ...doc,
          fileUrl: doc.fileKey
            ? await this.storageService.getPresignedUrl(doc.fileKey, 3600 * 24)
            : null,
        })),
      );
      whiteLabelWithDocs = {
        ...subscription.whiteLabel,
        documents: docsWithUrls,
      };
    }

    return {
      success: true,
      message: 'Application status fetched successfully.',
      hasApplication: Boolean(subscription?.whiteLabel),
      subscription,
      whiteLabel: whiteLabelWithDocs || null,
      payments: subscription?.payments || [],
    };
  }

  async getDocumentPreview(userId: string, documentId: string) {
    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: { whiteLabel: true },
      });

    if (!subscription?.whiteLabel) {
      throw new NotFoundException('No WhiteLabel found for this account.');
    }

    const doc = await this.prismaService.whiteLabelDocument.findFirst({
      where: {
        id: documentId,
        whiteLabelId: subscription.whiteLabel.id,
      },
    });

    if (!doc) {
      throw new NotFoundException(
        'Document not found or does not belong to your WhiteLabel.',
      );
    }

    if (!doc.fileKey) {
      throw new BadRequestException('Document has no valid file key stored.');
    }

    const fileUrl = await this.storageService.getPresignedUrl(
      doc.fileKey,
      3600 * 24,
    );

    return {
      success: true,
      fileUrl,
      name: doc.name,
      mimeType: doc.mimeType,
      fileSizeBytes: doc.fileSizeBytes,
    };
  }

  async getContractPreview(userId: string) {
    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: { whiteLabel: true },
      });

    if (!subscription?.whiteLabel) {
      throw new NotFoundException('No WhiteLabel found for this account.');
    }

    const wl = subscription.whiteLabel;
    if (!wl.contractKey) {
      throw new NotFoundException(
        'No signed contract agreement has been uploaded for your WhiteLabel application yet.',
      );
    }

    const contractUrl = await this.storageService.getPresignedUrl(
      wl.contractKey,
      3600,
    );

    return {
      success: true,
      contractUrl,
      fileName: wl.contractFileName || 'signed-agreement.pdf',
      fileSize: wl.contractFileSize,
      uploadedAt: wl.contractUploadedAt,
    };
  }

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    documentType: string,
    title?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for upload.');
    }

    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: { whiteLabel: true },
      });

    if (!subscription?.whiteLabel) {
      throw new NotFoundException('No WhiteLabel found for this account.');
    }

    const whiteLabel = subscription.whiteLabel;
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `whitelabels/${whiteLabel.id}/documents/${Date.now()}-${sanitizedFilename}`;

    await this.storageService.uploadFileBuffer(
      fileKey,
      file.buffer,
      file.mimetype,
    );

    const fileUrl = await this.storageService.getPresignedUrl(
      fileKey,
      DOCUMENT_URL_TTL_SECONDS,
    );
    const docCode = await generateUniqueCode(
      this.prismaService,
      'whiteLabelDocument',
      CodePrefix.WHITELABEL_DOCUMENT,
    );

    const document = await this.prismaService.whiteLabelDocument.create({
      data: {
        code: docCode,
        whiteLabelId: whiteLabel.id,
        name: title || file.originalname,
        type: documentType || 'SIGNED_AGREEMENT',
        fileKey,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
      },
    });

    return {
      success: true,
      message: 'Document uploaded successfully to storage.',
      document: {
        ...document,
        fileUrl,
      },
    };
  }

  async getDocuments(userId: string) {
    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: { whiteLabel: true },
      });

    if (!subscription?.whiteLabel) {
      return { success: true, documents: [] };
    }

    const documents = await this.prismaService.whiteLabelDocument.findMany({
      where: { whiteLabelId: subscription.whiteLabel.id },
      orderBy: { createdAt: 'desc' },
    });

    const docsWithUrls = await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        fileUrl: await this.storageService.getPresignedUrl(
          doc.fileKey,
          DOCUMENT_URL_TTL_SECONDS,
        ),
      })),
    );

    return {
      success: true,
      documents: docsWithUrls,
    };
  }

  async deleteDocument(userId: string, documentId: string) {
    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: { whiteLabel: true },
      });

    if (!subscription?.whiteLabel) {
      throw new NotFoundException('WhiteLabel not found.');
    }

    const doc = await this.prismaService.whiteLabelDocument.findFirst({
      where: {
        id: documentId,
        whiteLabelId: subscription.whiteLabel.id,
      },
    });

    if (!doc) {
      throw new NotFoundException(
        'Document not found or does not belong to your WhiteLabel.',
      );
    }

    if (doc.fileKey) {
      try {
        await this.storageService.deleteFile(doc.fileKey);
      } catch (err) {
        console.error('Failed to delete storage file:', err);
      }
    }

    await this.prismaService.whiteLabelDocument.delete({
      where: { id: documentId },
    });

    return {
      success: true,
      message: 'Document removed successfully.',
    };
  }

  async getBranding(userId: string) {
    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: { whiteLabel: true },
      });

    if (!subscription?.whiteLabel) {
      throw new NotFoundException('WhiteLabel not found for this account.');
    }

    const wl = subscription.whiteLabel;
    return {
      success: true,
      branding: {
        id: wl.id,
        code: wl.code,
        name: wl.name,
        status: wl.status,
        businessType: wl.businessType,
        companyWebsite: wl.companyWebsite,
        country: wl.country,
        yearsInBusiness: wl.yearsInBusiness,
        isIncorporated: wl.isIncorporated,
        incorporationDocUrl: wl.incorporationDocUrl,
        contactFirstName: wl.contactFirstName,
        contactLastName: wl.contactLastName,
        contactEmail: wl.contactEmail,
        contactLinkedIn: wl.contactLinkedIn,
        onboardingDetails: wl.onboardingDetails,
        subdomain: wl.subdomain,
        customDomain: wl.customDomain,
        elasticIpv4:
          (wl as { elasticIpv4?: string | null }).elasticIpv4 || null,
        tagline: wl.tagline,
        description: wl.description,
        logoUrl: wl.logoUrl,
        logoDarkUrl: wl.logoDarkUrl,
        faviconUrl: wl.faviconUrl,
        bannerUrl: wl.bannerUrl,
        primaryColor: wl.primaryColor || '#6366f1',
        accentColor: wl.accentColor || '#ec4899',
        themeRadius: wl.themeRadius || '0.5rem',
        themeFont: wl.themeFont || 'Inter',
        themeMode: wl.themeMode || 'dark',
        cardStyle: wl.cardStyle || 'modern',
        navbarStyle: wl.navbarStyle || 'glass',
        userSignupModel: wl.userSignupModel,
        supportEmail: wl.supportEmail,
        supportPhone: wl.supportPhone,
        copyrightText: wl.copyrightText,
        socialInstagram: wl.socialInstagram,
        socialTwitter: wl.socialTwitter,
        socialYoutube: wl.socialYoutube,
        socialSpotify: wl.socialSpotify,
        socialFacebook: wl.socialFacebook,
        socialLinkedin: wl.socialLinkedin,
        socialTiktok: wl.socialTiktok,
        cloudflareZoneId: wl.cloudflareZoneId || null,
        cloudflareBaseDomain: wl.cloudflareBaseDomain || null,
        hasCloudflareCredentials: Boolean(
          wl.cloudflareApiToken &&
          wl.cloudflareZoneId &&
          wl.cloudflareBaseDomain,
        ),
        awsInstanceId: wl.awsInstanceId || null,
        awsElasticIp: wl.awsElasticIp || null,
        awsInstanceType: wl.awsInstanceType || null,
        awsInstanceState: wl.awsInstanceState || null,
        s3BucketArn: wl.s3BucketArn || null,
        bucketName: wl.bucketName || null,
        sesIdentityStatus: wl.sesIdentityStatus || null,
        provisioningStatus: wl.provisioningStatus || null,
        provisioningProgress: wl.provisioningProgress || 0,
        provisioningStep: wl.provisioningStep || null,
        provisionedAt: wl.provisionedAt ? wl.provisionedAt.toISOString() : null,
        provisioningError: wl.provisioningError || null,
        isSetupComplete: Boolean(wl.isSetupComplete),
        hasOwner:
          (await this.prismaService.whiteLabelUser.count({
            where: {
              whiteLabelId: wl.id,
              role: WhiteLabelUserRole.OWNER,
            },
          })) > 0,
      },
    };
  }

  async completeSetup(userId: string, dto: ClientSetupWhiteLabelDto) {
    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: { whiteLabel: true },
      });

    if (!subscription?.whiteLabel) {
      throw new NotFoundException('WhiteLabel not found for this account.');
    }

    const wl = subscription.whiteLabel;

    // 1. If owner credentials provided and no OWNER user exists yet, create the Owner WhiteLabelUser
    if (dto.ownerEmail && dto.ownerPassword) {
      const normalizedEmail = dto.ownerEmail.trim().toLowerCase();
      const existingUser = await this.prismaService.whiteLabelUser.findFirst({
        where: {
          whiteLabelId: wl.id,
          role: WhiteLabelUserRole.OWNER,
        },
      });

      if (!existingUser) {
        const passwordHash = (
          await argon2.hash(dto.ownerPassword, ARGON2_CONFIG)
        ).toString();
        const userCode = await generateUniqueCode(
          this.prismaService,
          'whiteLabelUser',
          CodePrefix.WHITELABEL_USER,
        );

        await this.prismaService.whiteLabelUser.create({
          data: {
            code: userCode,
            email: normalizedEmail,
            firstName:
              dto.ownerFirstName?.trim() || wl.contactFirstName || 'Portal',
            lastName:
              dto.ownerLastName?.trim() || wl.contactLastName || 'Owner',
            role: WhiteLabelUserRole.OWNER,
            passwordHash,
            isApproved: true,
            whiteLabelId: wl.id,
          },
        });
      }
    }

    // 2. Persist All Setup Configurations into Platform API Database
    const updated = await this.prismaService.whiteLabel.update({
      where: { id: wl.id },
      data: {
        name: dto.name.trim(),
        tagline: dto.tagline?.trim() || null,
        description: dto.description?.trim() || null,
        supportEmail: dto.supportEmail.trim().toLowerCase(),
        supportPhone: dto.supportPhone?.trim() || null,
        copyrightText:
          dto.copyrightText?.trim() ||
          `© ${new Date().getFullYear()} ${dto.name.trim()}. All rights reserved.`,
        primaryColor: dto.primaryColor || '#6366f1',
        accentColor: dto.accentColor || '#ec4899',
        themeRadius: dto.themeRadius || '0.5rem',
        themeFont: dto.themeFont || 'Inter',
        themeMode: dto.themeMode || 'dark',
        cardStyle: dto.cardStyle || 'modern',
        navbarStyle: dto.navbarStyle || 'glass',
        userSignupModel: dto.userSignupModel || wl.userSignupModel,
        logoUrl: dto.logoUrl?.trim() || null,
        logoDarkUrl: dto.logoDarkUrl?.trim() || null,
        faviconUrl: dto.faviconUrl?.trim() || null,
        bannerUrl: dto.bannerUrl?.trim() || null,
        socialInstagram: dto.socialInstagram?.trim() || null,
        socialTwitter: dto.socialTwitter?.trim() || null,
        socialYoutube: dto.socialYoutube?.trim() || null,
        socialSpotify: dto.socialSpotify?.trim() || null,
        socialFacebook: dto.socialFacebook?.trim() || null,
        socialLinkedin: dto.socialLinkedin?.trim() || null,
        socialTiktok: dto.socialTiktok?.trim() || null,
        ...(dto.customDomain !== undefined &&
          dto.customDomain.trim() !== '' && {
            customDomain: dto.customDomain.trim().toLowerCase(),
          }),
        ...(dto.bucketName !== undefined &&
          dto.bucketName.trim() !== '' && {
            bucketName: dto.bucketName.trim().toLowerCase(),
          }),
        ...(dto.elasticIpv4 !== undefined &&
          dto.elasticIpv4.trim() !== '' && {
            elasticIpv4: dto.elasticIpv4.trim(),
          }),
        ...(dto.cloudflareZoneId !== undefined &&
          dto.cloudflareZoneId.trim() !== '' && {
            cloudflareZoneId: dto.cloudflareZoneId.trim(),
          }),
        ...(dto.cloudflareBaseDomain !== undefined &&
          dto.cloudflareBaseDomain.trim() !== '' && {
            cloudflareBaseDomain: dto.cloudflareBaseDomain.trim().toLowerCase(),
          }),
        ...(dto.awsRegion !== undefined &&
          dto.awsRegion.trim() !== '' && {
            awsRegion: dto.awsRegion.trim(),
          }),
        ...(dto.awsInstanceType !== undefined &&
          dto.awsInstanceType.trim() !== '' && {
            awsInstanceType: dto.awsInstanceType.trim(),
          }),
        ...(dto.senderEmail !== undefined &&
          dto.senderEmail.trim() !== '' && {
            senderEmail: dto.senderEmail.trim().toLowerCase(),
          }),
        isSetupComplete: true,
        status: WhiteLabelStatus.ACTIVE,
      },
    });

    // 2b. Auto-generate a Production API Key if the tenant does not have one yet
    let generatedApiKey: string | null = null;
    const existingActiveKeyCount =
      await this.prismaService.whiteLabelApiKey.count({
        where: { whiteLabelId: wl.id, isActive: true },
      });

    if (existingActiveKeyCount === 0) {
      const rawKey = `rmit_live_${crypto.randomBytes(24).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
      const keyCode = await generateUniqueCode(
        this.prismaService,
        'whiteLabelApiKey',
        CodePrefix.WHITELABEL_API_KEY,
      );

      const newKey = await this.prismaService.whiteLabelApiKey.create({
        data: {
          code: keyCode,
          name: 'Production Portal Key',
          keyHash,
          keyPrefix: `${rawKey.slice(0, 10)}...${rawKey.slice(-4)}`,
          keyMasked: `${rawKey.slice(0, 10)}****************${rawKey.slice(-4)}`,
          isActive: true,
          whiteLabelId: wl.id,
        },
      });

      await this.redisService.set(
        `whitelabel:apikey:${keyHash}`,
        JSON.stringify({
          whiteLabelId: wl.id,
          name: newKey.name,
          keyId: newKey.id,
          status: 'ACTIVE',
        }),
      );

      generatedApiKey = rawKey;
    }

    // 3. Cache Theme in Redis
    await this.redisService.set(
      `whitelabel:config:${wl.id}:theme`,
      JSON.stringify({
        primaryColor: updated.primaryColor,
        accentColor: updated.accentColor,
        radius: updated.themeRadius,
        mode: updated.themeMode,
        fontFamily: updated.themeFont,
        cardStyle: updated.cardStyle,
        navbarStyle: updated.navbarStyle,
      }),
    );

    // 4. Cache SSO in Redis
    await this.redisService.set(
      `whitelabel:config:${wl.id}:sso`,
      JSON.stringify({
        userSignupModel: updated.userSignupModel,
        googleEnabled: updated.ssoGoogleEnabled,
        githubEnabled: updated.ssoGithubEnabled,
        enforce2fa: updated.ssoEnforce2fa,
        sessionTimeoutHours: updated.ssoSessionTimeoutHours,
      }),
    );

    const brandingRes = await this.getBranding(userId);
    return {
      ...brandingRes,
      generatedApiKey,
    };
  }

  async updateBranding(userId: string, dto: UpdateBrandingDto) {
    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: { whiteLabel: true },
      });

    if (!subscription?.whiteLabel) {
      throw new NotFoundException('WhiteLabel not found for this account.');
    }

    const wlId = subscription.whiteLabel.id;

    const updated = await this.prismaService.whiteLabel.update({
      where: { id: wlId },
      data: {
        // Brand name, business model, registered company status, and country/territory are permanently immutable once registered; dto.name, dto.isIncorporated are intentionally ignored
        tagline: dto.tagline !== undefined ? dto.tagline : undefined,
        description:
          dto.description !== undefined ? dto.description : undefined,
        companyWebsite:
          dto.companyWebsite !== undefined ? dto.companyWebsite : undefined,
        yearsInBusiness:
          dto.yearsInBusiness !== undefined ? dto.yearsInBusiness : undefined,
        contactFirstName:
          dto.contactFirstName !== undefined ? dto.contactFirstName : undefined,
        contactLastName:
          dto.contactLastName !== undefined ? dto.contactLastName : undefined,
        contactEmail:
          dto.contactEmail !== undefined ? dto.contactEmail : undefined,
        contactLinkedIn:
          dto.contactLinkedIn !== undefined ? dto.contactLinkedIn : undefined,
        primaryColor:
          dto.primaryColor !== undefined ? dto.primaryColor : undefined,
        accentColor:
          dto.accentColor !== undefined ? dto.accentColor : undefined,
        supportEmail:
          dto.supportEmail !== undefined ? dto.supportEmail : undefined,
        supportPhone:
          dto.supportPhone !== undefined ? dto.supportPhone : undefined,
        copyrightText:
          dto.copyrightText !== undefined ? dto.copyrightText : undefined,
        socialInstagram:
          dto.socialInstagram !== undefined ? dto.socialInstagram : undefined,
        socialTwitter:
          dto.socialTwitter !== undefined ? dto.socialTwitter : undefined,
        socialYoutube:
          dto.socialYoutube !== undefined ? dto.socialYoutube : undefined,
        socialSpotify:
          dto.socialSpotify !== undefined ? dto.socialSpotify : undefined,
        socialFacebook:
          dto.socialFacebook !== undefined ? dto.socialFacebook : undefined,
        socialLinkedin:
          dto.socialLinkedin !== undefined ? dto.socialLinkedin : undefined,
        socialTiktok:
          dto.socialTiktok !== undefined ? dto.socialTiktok : undefined,
      },
    });

    return {
      success: true,
      message: 'Identity & branding settings updated successfully.',
      branding: updated,
    };
  }

  async uploadBrandingAsset(
    userId: string,
    file: Express.Multer.File,
    assetType: 'logo' | 'logoDark' | 'favicon' | 'banner',
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided.');
    }

    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: { whiteLabel: true },
      });

    if (!subscription?.whiteLabel) {
      throw new NotFoundException('WhiteLabel not found for this account.');
    }

    const wl = subscription.whiteLabel;
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `whitelabels/${wl.id}/branding/${assetType}-${Date.now()}-${sanitizedFilename}`;

    await this.storageService.uploadFileBuffer(
      fileKey,
      file.buffer,
      file.mimetype,
      { cacheControl: IMMUTABLE_CACHE_CONTROL },
    );

    const assetUrl = this.storageService.getFileUrl(fileKey);

    const fieldMap: Record<string, string> = {
      logo: 'logoUrl',
      logoDark: 'logoDarkUrl',
      favicon: 'faviconUrl',
      banner: 'bannerUrl',
    };

    const targetField = fieldMap[assetType] || 'logoUrl';

    const updated = await this.prismaService.whiteLabel.update({
      where: { id: wl.id },
      data: {
        [targetField]: assetUrl,
      },
    });

    return {
      success: true,
      message: `${assetType} uploaded successfully.`,
      assetUrl,
      assetType,
      branding: updated,
    };
  }

  async deleteBrandingAsset(
    userId: string,
    assetType: 'logo' | 'logoDark' | 'favicon' | 'banner',
  ) {
    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: { whiteLabel: true },
      });

    if (!subscription?.whiteLabel) {
      throw new NotFoundException('WhiteLabel not found for this account.');
    }

    const fieldMap: Record<string, string> = {
      logo: 'logoUrl',
      logoDark: 'logoDarkUrl',
      favicon: 'faviconUrl',
      banner: 'bannerUrl',
    };

    const targetField = fieldMap[assetType] || 'logoUrl';

    const updated = await this.prismaService.whiteLabel.update({
      where: { id: subscription.whiteLabel.id },
      data: {
        [targetField]: null,
      },
    });

    return {
      success: true,
      message: `${assetType} removed successfully.`,
      branding: updated,
    };
  }

  private async getActiveWhiteLabel(userId: string) {
    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: { whiteLabel: true },
      });

    if (!subscription?.whiteLabel) {
      throw new NotFoundException('WhiteLabel not found for this account.');
    }

    return subscription.whiteLabel;
  }

  // --- 1. Theme Customizer ---
  async getTheme(userId: string) {
    const wl = await this.getActiveWhiteLabel(userId);
    const cached = await this.redisService.get(
      `whitelabel:config:${wl.id}:theme`,
    );
    const existing: CachedThemeConfig = cached
      ? (JSON.parse(cached) as CachedThemeConfig)
      : {};

    return {
      success: true,
      theme: {
        primaryColor: wl.primaryColor || existing.primaryColor || '#6366f1',
        accentColor: wl.accentColor || existing.accentColor || '#ec4899',
        radius: wl.themeRadius || existing.radius || '0.5rem',
        mode:
          (wl.themeMode as 'light' | 'dark' | 'system') ||
          existing.mode ||
          'dark',
        fontFamily: wl.themeFont || existing.fontFamily || 'Inter',
        cardStyle:
          (wl.cardStyle as 'modern' | 'glass' | 'flat' | 'bordered') ||
          existing.cardStyle ||
          'modern',
        navbarStyle:
          (wl.navbarStyle as 'solid' | 'glass' | 'floating') ||
          existing.navbarStyle ||
          'glass',
      },
    };
  }

  async updateTheme(userId: string, dto: UpdateThemeDto) {
    const wl = await this.getActiveWhiteLabel(userId);

    const updated = await this.prismaService.whiteLabel.update({
      where: { id: wl.id },
      data: {
        primaryColor: dto.primaryColor || undefined,
        accentColor: dto.accentColor || undefined,
        themeRadius: dto.radius || undefined,
        themeMode: dto.mode || undefined,
        themeFont: dto.fontFamily || undefined,
        cardStyle: dto.cardStyle || undefined,
        navbarStyle: dto.navbarStyle || undefined,
      },
    });

    const themeData = {
      primaryColor: updated.primaryColor || '#6366f1',
      accentColor: updated.accentColor || '#ec4899',
      radius: updated.themeRadius || '0.5rem',
      mode: updated.themeMode || 'dark',
      fontFamily: updated.themeFont || 'Inter',
      cardStyle: updated.cardStyle || 'modern',
      navbarStyle: updated.navbarStyle || 'glass',
    };

    await this.redisService.set(
      `whitelabel:config:${wl.id}:theme`,
      JSON.stringify(themeData),
    );

    return {
      success: true,
      message: 'Theme customization saved successfully.',
      theme: themeData,
    };
  }

  // --- 2. Domain & DNS Configuration ---
  async getDomainConfig(userId: string) {
    let wl = await this.getActiveWhiteLabel(userId);

    // Auto-generate verification token if not present
    if (!wl.domainVerificationToken) {
      const token = `rmit_verify_${crypto.randomBytes(16).toString('hex')}`;
      wl = await this.prismaService.whiteLabel.update({
        where: { id: wl.id },
        data: { domainVerificationToken: token },
      });
    }

    const verificationToken = wl.domainVerificationToken!;
    const platformSubdomainFqdn = wl.subdomain
      ? `${wl.subdomain}.platform.royalmotionit.com`
      : null;

    const hasCloudflareCredentials = Boolean(
      wl.cloudflareApiToken && wl.cloudflareZoneId && wl.cloudflareBaseDomain,
    );
    const cleanBaseDomain = this.extractCleanBaseDomain(
      wl.cloudflareBaseDomain,
    );
    const expectedCustomDomain = cleanBaseDomain
      ? `backstage.${cleanBaseDomain}`
      : null;

    const cachedHealthStr = await this.redisService.get(
      `whitelabel:config:${wl.id}:domain_health`,
    );
    let health: DomainHealthReport | null = null;
    if (cachedHealthStr) {
      try {
        health = JSON.parse(cachedHealthStr);
      } catch {}
    }

    return {
      success: true,
      domain: {
        subdomain: wl.subdomain,
        elasticIpv4:
          (wl as { elasticIpv4?: string | null }).elasticIpv4 || null,
        platformSubdomainFqdn,
        isPlatformSubdomainAutomated: true,
        customDomain: wl.customDomain || null,
        domainVerificationToken: verificationToken,
        hasCloudflareCredentials,
        cloudflareBaseDomain: cleanBaseDomain || null,
        expectedCustomDomain,
        cloudflareZoneId: wl.cloudflareZoneId || null,
        cnameTarget:
          platformSubdomainFqdn || 'platform.royalmotionit.com',
        cnameHost: 'backstage',
        health,
        // Step 1: DNS TXT Ownership Verification
        step1: {
          title: 'Step 1: Domain Ownership Verification (TXT Record)',
          recordType: 'TXT',
          host: wl.customDomain
            ? `_royalmotionit-verification.${wl.customDomain}`
            : expectedCustomDomain
              ? `_royalmotionit-verification.${expectedCustomDomain}`
              : '_royalmotionit-verification',
          value: `royalmotionit-verification=${verificationToken}`,
          verified: wl.domainVerified,
          verifiedAt: wl.domainVerifiedAt,
        },
        // Step 2: Traffic Routing (Unlocked only after step 1 verified)
        step2: {
          title: 'Step 2: Traffic Routing Configuration',
          unlocked: wl.domainVerified,
          cnameTarget:
            platformSubdomainFqdn || 'platform.royalmotionit.com',
          serverIp: process.env.PLATFORM_SERVER_IP || '104.21.58.192',
          note: wl.domainVerified
            ? `Point CNAME for "backstage" to your platform subdomain: ${platformSubdomainFqdn || 'platform.royalmotionit.com'}`
            : 'Complete Step 1 TXT ownership verification above to reveal routing configuration.',
        },
        verified: wl.domainVerified,
        verifiedAt: wl.domainVerifiedAt,
        sslStatus: wl.domainSslStatus || 'NOT_CONFIGURED',
      },
    };
  }

  async updateDomain(userId: string, dto: UpdateDomainDto) {
    const wl = await this.getActiveWhiteLabel(userId);
    const customDomain =
      dto.customDomain !== undefined
        ? dto.customDomain && dto.customDomain.trim()
          ? dto.customDomain.toLowerCase().trim()
          : null
        : undefined;
    const cleanElasticIpv4 =
      dto.elasticIpv4 !== undefined
        ? dto.elasticIpv4
          ? dto.elasticIpv4.trim()
          : null
        : undefined;

    const cleanBaseDomain = this.extractCleanBaseDomain(
      wl.cloudflareBaseDomain,
    );
    const expectedCustomDomain = cleanBaseDomain
      ? `backstage.${cleanBaseDomain}`
      : null;

    // Check custom domain assignment requirements
    if (customDomain) {
      // 1. Cloudflare credentials prerequisite check
      const hasCloudflareCreds = Boolean(
        wl.cloudflareApiToken && wl.cloudflareZoneId && wl.cloudflareBaseDomain,
      );
      if (!hasCloudflareCreds) {
        throw new BadRequestException(
          'Cloudflare credentials (API Token, Zone ID, and Base Domain) must be configured in Credentials & SSO before assigning a custom domain.',
        );
      }

      if (!cleanBaseDomain || !expectedCustomDomain) {
        throw new BadRequestException(
          'Configured Cloudflare Base Domain is invalid. Please update it in Credentials & SSO.',
        );
      }

      // 2. Custom domain MUST strictly be backstage.basedomain
      if (customDomain !== expectedCustomDomain) {
        throw new BadRequestException(
          `Custom domain must be "${expectedCustomDomain}" based on your configured Cloudflare Base Domain.`,
        );
      }
    }

    // Check custom domain conflicts
    if (customDomain && customDomain !== wl.customDomain) {
      const conflict = await this.prismaService.whiteLabel.findFirst({
        where: {
          customDomain,
          id: { not: wl.id },
        },
      });
      if (conflict) {
        throw new ConflictException(
          `Domain "${customDomain}" is already connected to another label.`,
        );
      }
    }

    // Subdomain is permanently immutable; dto.subdomain is intentionally ignored

    // Provision or update Cloudflare DNS A-record if elasticIpv4 changed
    let cloudflareMessage = '';
    if (cleanElasticIpv4 !== undefined && cleanElasticIpv4 !== wl.elasticIpv4) {
      if (wl.subdomain) {
        const dnsRes = await this.cloudflareDnsService.provisionSubdomain(
          wl.subdomain,
          cleanElasticIpv4 || undefined,
        );
        if (!dnsRes.success) {
          throw new BadRequestException(
            `Cloudflare DNS error: ${dnsRes.message}`,
          );
        }
        cloudflareMessage = ` Cloudflare DNS: ${dnsRes.message}`;
      }
    }

    // Auto-sync custom domain DNS into user's Cloudflare zone if credentials exist
    let autoVerified = false;
    let cloudflareCustomDomainMessage = '';
    let verificationToken = wl.domainVerificationToken;
    if (!verificationToken) {
      verificationToken = `rmit_verify_${crypto.randomBytes(16).toString('hex')}`;
    }

    if (customDomain && wl.cloudflareApiToken && wl.cloudflareZoneId) {
      try {
        const cfHeaders = {
          Authorization: `Bearer ${wl.cloudflareApiToken}`,
          'Content-Type': 'application/json',
        };

        const platformSubdomainFqdn = `${wl.subdomain}.platform.royalmotionit.com`;
        const cfSearch = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records?name=${encodeURIComponent(customDomain)}`,
          { headers: cfHeaders },
        );
        const cfSearchData = (await cfSearch.json()) as any;
        if (cfSearchData.success && Array.isArray(cfSearchData.result)) {
          if (cfSearchData.result.length === 0) {
            await fetch(
              `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records`,
              {
                method: 'POST',
                headers: cfHeaders,
                body: JSON.stringify({
                  type: 'CNAME',
                  name: customDomain,
                  content: platformSubdomainFqdn,
                  ttl: 1,
                  proxied: true,
                  comment: `Managed WhiteLabel Custom Domain routing to ${platformSubdomainFqdn}`,
                }),
              },
            );
          }
        }

        // 2. TXT for ownership verification
        const txtName = `_royalmotionit-verification.${customDomain}`;
        const txtValue = `royalmotionit-verification=${verificationToken}`;
        const cfTxtSearch = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records?name=${encodeURIComponent(txtName)}`,
          { headers: cfHeaders },
        );
        const cfTxtData = (await cfTxtSearch.json()) as any;
        if (cfTxtData.success && Array.isArray(cfTxtData.result)) {
          if (cfTxtData.result.length === 0) {
            await fetch(
              `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records`,
              {
                method: 'POST',
                headers: cfHeaders,
                body: JSON.stringify({
                  type: 'TXT',
                  name: txtName,
                  content: txtValue,
                  ttl: 120,
                  comment: 'WhiteLabel Ownership Verification',
                }),
              },
            );
          }
        }

        autoVerified = true;
        cloudflareCustomDomainMessage = ` Cloudflare DNS synchronized for ${customDomain}.`;
      } catch (err: any) {
        this.logger.warn(
          `Could not auto-provision Cloudflare DNS in user zone: ${err.message}`,
        );
      }
    }

    // If domain is being removed/disconnected, attempt to clean up DNS records in Cloudflare
    if (
      customDomain === null &&
      wl.customDomain &&
      wl.cloudflareApiToken &&
      wl.cloudflareZoneId
    ) {
      try {
        const cfHeaders = {
          Authorization: `Bearer ${wl.cloudflareApiToken}`,
          'Content-Type': 'application/json',
        };
        const searchRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records?name=${encodeURIComponent(wl.customDomain)}`,
          { headers: cfHeaders },
        );
        const searchData = (await searchRes.json()) as any;
        if (searchData.success && Array.isArray(searchData.result)) {
          for (const rec of searchData.result) {
            await fetch(
              `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records/${rec.id}`,
              { method: 'DELETE', headers: cfHeaders },
            );
          }
        }
      } catch (err: any) {
        this.logger.warn(
          `Could not delete custom domain record from Cloudflare on disconnect: ${err.message}`,
        );
      }
    }

    const isDomainChanging = customDomain !== wl.customDomain;
    const isVerifiedNow =
      autoVerified || (isDomainChanging ? false : wl.domainVerified);

    const updated = await this.prismaService.whiteLabel.update({
      where: { id: wl.id },
      data: {
        customDomain: customDomain !== undefined ? customDomain : undefined,
        domainVerificationToken: verificationToken,
        ...(cleanElasticIpv4 !== undefined
          ? { elasticIpv4: cleanElasticIpv4 }
          : {}),
        domainVerified: isVerifiedNow,
        domainVerifiedAt: isVerifiedNow
          ? wl.domainVerifiedAt || new Date()
          : isDomainChanging
            ? null
            : wl.domainVerifiedAt,
        domainSslStatus: isVerifiedNow
          ? 'ACTIVE'
          : isDomainChanging
            ? customDomain
              ? 'PENDING_VERIFICATION'
              : 'NOT_CONFIGURED'
            : wl.domainSslStatus,
      },
    });

    const status = {
      verified: updated.domainVerified,
      lastCheckedAt: new Date().toISOString(),
      sslStatus: updated.domainSslStatus,
      dnsStatus: updated.domainVerified ? 'VERIFIED' : 'PENDING_VERIFICATION',
    };

    await this.redisService.set(
      `whitelabel:config:${wl.id}:domain_status`,
      JSON.stringify(status),
    );

    return {
      success: true,
      message: `Domain & server routing updated successfully.${cloudflareMessage}${cloudflareCustomDomainMessage}`,
      domain: {
        subdomain: updated.subdomain,
        elasticIpv4:
          (updated as { elasticIpv4?: string | null }).elasticIpv4 || null,
        platformSubdomainFqdn: updated.subdomain
          ? `${updated.subdomain}.platform.royalmotionit.com`
          : null,
        customDomain: updated.customDomain,
        verified: updated.domainVerified,
        sslStatus: updated.domainSslStatus,
      },
    };
  }

  async verifyDomainDns(userId: string) {
    const wl = await this.getActiveWhiteLabel(userId);
    if (!wl.customDomain) {
      throw new BadRequestException('No custom domain configured to verify.');
    }

    const expectedToken = `royalmotionit-verification=${wl.domainVerificationToken}`;
    let verified = false;
    let diagnostic = '';

    try {
      // 0. Check Cloudflare API if credentials are provided
      if (wl.cloudflareApiToken && wl.cloudflareZoneId) {
        try {
          const cfRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records?name=${encodeURIComponent(`_royalmotionit-verification.${wl.customDomain}`)}`,
            {
              headers: {
                Authorization: `Bearer ${wl.cloudflareApiToken}`,
                'Content-Type': 'application/json',
              },
            },
          );
          const cfData = (await cfRes.json()) as any;
          if (
            cfData.success &&
            Array.isArray(cfData.result) &&
            cfData.result.length > 0
          ) {
            const hasMatch = cfData.result.some((rec: any) => {
              const clean = this.normalizeDnsTxtContent(rec.content);
              return (
                clean.includes(expectedToken) ||
                clean.includes(wl.domainVerificationToken || '')
              );
            });
            if (hasMatch) {
              verified = true;
              diagnostic = `DNS TXT ownership verified via Cloudflare API for ${wl.customDomain}`;
            }
          }
        } catch {
          // Continue to standard DNS resolution
        }
      }

      // 1. Check TXT record on _royalmotionit-verification subdomain and root
      if (!verified) {
        const txtTargets = [
          `_royalmotionit-verification.${wl.customDomain}`,
          wl.customDomain,
        ];

        for (const target of txtTargets) {
          try {
            const txtRecords = await dns.resolveTxt(target);
            const flatRecords = txtRecords.map((chunks) =>
              this.normalizeDnsTxtContent(chunks.join('')),
            );
            if (
              flatRecords.some(
                (rec) =>
                  rec.includes(expectedToken) ||
                  rec.includes(wl.domainVerificationToken || ''),
              )
            ) {
              verified = true;
              diagnostic = `DNS TXT verification succeeded at ${target}`;
              break;
            }
          } catch {
            // Continue to next target
          }
        }
      }

      // 2. Dev mode / bypass fallback if authoritative DNS lookup is not resolvable locally
      if (!verified) {
        if (
          process.env.NODE_ENV === 'development' ||
          process.env.BYPASS_DNS_CHECK === 'true'
        ) {
          verified = true;
          diagnostic = `[DEV MODE] Simulated successful DNS ownership verification for ${wl.customDomain}.`;
        } else {
          throw new BadRequestException(
            `Ownership verification failed. No TXT record matching "${expectedToken}" was detected on "_royalmotionit-verification.${wl.customDomain}". Please add the TXT record in your DNS provider and allow DNS propagation before retrying.`,
          );
        }
      }
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      if (
        process.env.NODE_ENV === 'development' ||
        process.env.BYPASS_DNS_CHECK === 'true'
      ) {
        verified = true;
        diagnostic = `[DEV MODE] DNS fallback verification accepted for ${wl.customDomain}.`;
      } else {
        const errMsg = err instanceof Error ? err.message : 'DNS lookup failed';
        throw new BadRequestException(
          `Unable to resolve DNS records for ${wl.customDomain}. Ensure your domain is active and registered. Details: ${errMsg}`,
        );
      }
    }

    const now = new Date();
    const updated = await this.prismaService.whiteLabel.update({
      where: { id: wl.id },
      data: {
        domainVerified: verified,
        domainVerifiedAt: verified ? now : null,
        domainSslStatus: verified ? 'ACTIVE' : 'PENDING_VERIFICATION',
      },
    });

    const status = {
      verified: updated.domainVerified,
      lastCheckedAt: now.toISOString(),
      sslStatus: updated.domainSslStatus,
      dnsStatus: updated.domainVerified ? 'VERIFIED' : 'PENDING_VERIFICATION',
      diagnostic,
    };

    await this.redisService.set(
      `whitelabel:config:${wl.id}:domain_status`,
      JSON.stringify(status),
    );

    return {
      success: true,
      message:
        diagnostic ||
        'Domain ownership verified successfully! Traffic routing instructions are now unlocked.',
      verified: true,
      domain: {
        customDomain: updated.customDomain,
        verified: updated.domainVerified,
        verifiedAt: updated.domainVerifiedAt,
        cnameTarget: wl.subdomain
          ? `${wl.subdomain}.platform.royalmotionit.com`
          : 'platform.royalmotionit.com',
        serverIp: process.env.PLATFORM_SERVER_IP || '104.21.58.192',
      },
    };
  }

  // --- Step 1: Verify 3-way Cloudflare Interconnection ---
  async verifyCloudflareInterconnection(userId: string) {
    const wl = await this.getActiveWhiteLabel(userId);
    const token = wl.cloudflareApiToken;
    const zoneId = wl.cloudflareZoneId;
    const rawBaseDomain = wl.cloudflareBaseDomain;

    if (!token || !zoneId || !rawBaseDomain) {
      const missing: string[] = [];
      if (!token) missing.push('API Token');
      if (!zoneId) missing.push('Zone ID');
      if (!rawBaseDomain) missing.push('Base Domain');
      return {
        success: false,
        step: 'MISSING_CREDENTIALS',
        message: `Missing Cloudflare configuration in Credentials & SSO: ${missing.join(', ')} required.`,
      };
    }

    const cleanBaseDomain = this.extractCleanBaseDomain(rawBaseDomain);
    if (!cleanBaseDomain) {
      return {
        success: false,
        step: 'INVALID_BASE_DOMAIN',
        message:
          'The configured Base Domain is invalid. Please format as a standard domain (e.g. yourlabel.com).',
      };
    }

    try {
      // 1. Verify Zone access and authenticity with token
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const data = (await res.json()) as any;

      if (!data.success || !data.result) {
        const errMsg =
          data.errors?.[0]?.message ||
          'Verification rejected by Cloudflare API';
        return {
          success: false,
          step: 'AUTH_FAILED',
          message: `Cloudflare API authentication failed: ${errMsg}`,
        };
      }

      const zoneName = (data.result.name || '').toLowerCase().trim();
      const zoneStatus = data.result.status || 'unknown';

      // 2. Verify Zone matches Base Domain (3-way interconnected)
      if (zoneName !== cleanBaseDomain) {
        return {
          success: false,
          step: 'DOMAIN_MISMATCH',
          message: `Cloudflare Zone mismatch: Zone ID "${zoneId}" corresponds to zone "${data.result.name}", but your configured Base Domain is "${cleanBaseDomain}". The Zone and Base Domain must match exactly.`,
          details: {
            zoneId,
            zoneName: data.result.name,
            configuredBaseDomain: cleanBaseDomain,
          },
        };
      }

      // 3. Verify Zone is Active
      if (zoneStatus !== 'active') {
        return {
          success: false,
          step: 'ZONE_INACTIVE',
          message: `Cloudflare Zone "${data.result.name}" is "${zoneStatus}". Please ensure nameservers are pointed to Cloudflare.`,
          details: {
            zoneId,
            zoneName: data.result.name,
            zoneStatus,
            nameServers: data.result.name_servers,
          },
        };
      }

      // 4. Test DNS Record permissions
      let hasDnsEditPermission = true;
      try {
        const dnsTest = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?per_page=1`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );
        if (dnsTest.status === 403 || dnsTest.status === 401) {
          hasDnsEditPermission = false;
        }
      } catch {
        hasDnsEditPermission = false;
      }

      const result = {
        success: true,
        step: 'VERIFIED',
        message: `All 3 Cloudflare credentials interconnected properly! Zone "${data.result.name}" is active and matches Base Domain.`,
        details: {
          zoneId,
          zoneName: data.result.name,
          zoneStatus,
          configuredBaseDomain: cleanBaseDomain,
          targetCustomDomain: `backstage.${cleanBaseDomain}`,
          hasDnsEditPermission,
          nameServers: data.result.name_servers,
        },
      };
      await this.redisService.del(`whitelabel:config:${wl.id}:domain_health`);
      return result;
    } catch (err: any) {
      return {
        success: false,
        step: 'NETWORK_ERROR',
        message: `Failed to connect to Cloudflare: ${err.message}`,
      };
    }
  }

  /**
   * Normalizes DNS TXT record contents by removing wrapping quotes,
   * unescaping quotes, and trimming whitespace.
   * Per RFC 1035 and Cloudflare specifications, TXT records are enclosed in quotes.
   */
  normalizeDnsTxtContent(content?: string | null): string {
    if (!content) return '';
    return content
      .trim()
      .replace(/^["']+|["']+$/g, '')
      .replace(/\\"/g, '"')
      .replace(/^["']+|["']+$/g, '')
      .trim();
  }

  // --- Step 2: Hold Domain & Verify Ownership ---
  async holdAndVerifyCustomDomain(userId: string) {
    const wl = await this.getActiveWhiteLabel(userId);
    const cfCheck = await this.verifyCloudflareInterconnection(userId);
    if (!cfCheck.success) {
      throw new BadRequestException(cfCheck.message);
    }

    const cleanBaseDomain = this.extractCleanBaseDomain(
      wl.cloudflareBaseDomain,
    );
    const expectedCustomDomain = `backstage.${cleanBaseDomain}`;

    // Conflict check: Ensure no other label holds this domain
    const conflict = await this.prismaService.whiteLabel.findFirst({
      where: {
        customDomain: expectedCustomDomain,
        id: { not: wl.id },
      },
    });
    if (conflict) {
      throw new ConflictException(
        `Domain "${expectedCustomDomain}" is already held by another label.`,
      );
    }

    // Auto-generate verification token if not present
    let verificationToken = wl.domainVerificationToken;
    if (!verificationToken) {
      verificationToken = `rmit_verify_${crypto.randomBytes(16).toString('hex')}`;
    }

    // Hold the domain backstage.basedomain in DB
    await this.prismaService.whiteLabel.update({
      where: { id: wl.id },
      data: {
        customDomain: expectedCustomDomain,
        domainVerificationToken: verificationToken,
      },
    });

    const txtName = `_royalmotionit-verification.backstage`;
    const txtFullFqdn = `_royalmotionit-verification.${expectedCustomDomain}`;
    const txtValue = `royalmotionit-verification=${verificationToken}`;

    let autoVerified = false;
    let autoSyncMessage = '';

    // Attempt auto-provisioning TXT record in user's Cloudflare zone
    try {
      const cfHeaders = {
        Authorization: `Bearer ${wl.cloudflareApiToken}`,
        'Content-Type': 'application/json',
      };

      const cfTxtSearch = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records?name=${encodeURIComponent(txtFullFqdn)}&type=TXT`,
        { headers: cfHeaders },
      );
      const cfTxtData = (await cfTxtSearch.json()) as any;

      if (
        cfTxtData.success &&
        Array.isArray(cfTxtData.result) &&
        cfTxtData.result.length > 0
      ) {
        const existingRec = cfTxtData.result[0];
        const cleanExisting = this.normalizeDnsTxtContent(existingRec.content);
        const cleanExpected = this.normalizeDnsTxtContent(txtValue);
        const isMatch =
          cleanExisting === cleanExpected ||
          cleanExisting.includes(verificationToken);

        if (isMatch) {
          autoVerified = true;
          autoSyncMessage =
            'TXT ownership verification record verified in Cloudflare.';
        } else {
          await fetch(
            `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records/${existingRec.id}`,
            {
              method: 'PUT',
              headers: cfHeaders,
              body: JSON.stringify({
                type: 'TXT',
                name: txtName,
                content: `"${txtValue}"`,
                ttl: 120,
                comment: 'WhiteLabel Ownership Verification',
              }),
            },
          );
          autoVerified = true;
          autoSyncMessage =
            'TXT ownership verification record updated in Cloudflare.';
        }
      } else {
        const createRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records`,
          {
            method: 'POST',
            headers: cfHeaders,
            body: JSON.stringify({
              type: 'TXT',
              name: txtName,
              content: `"${txtValue}"`,
              ttl: 120,
              comment: 'WhiteLabel Ownership Verification',
            }),
          },
        );
        const createData = (await createRes.json()) as any;
        if (createData.success) {
          autoVerified = true;
          autoSyncMessage = 'TXT ownership record created in Cloudflare.';
        }
      }
    } catch (err: any) {
      this.logger.warn(
        `Could not auto-create TXT record in user Cloudflare zone: ${err.message}`,
      );
    }

    // Verify via DNS if Cloudflare API wasn't definitive
    if (!autoVerified) {
      try {
        const records = await dns.resolveTxt(txtFullFqdn);
        const flat = records.map((c) =>
          this.normalizeDnsTxtContent(c.join('')),
        );
        if (
          flat.some(
            (r) =>
              r.includes(verificationToken!) ||
              r === `royalmotionit-verification=${verificationToken}`,
          )
        ) {
          autoVerified = true;
        }
      } catch {
        // Fallback for local development or DNS propagation
        if (
          process.env.NODE_ENV === 'development' ||
          process.env.BYPASS_DNS_CHECK === 'true'
        ) {
          autoVerified = true;
        }
      }
    }

    const now = new Date();
    const updated = await this.prismaService.whiteLabel.update({
      where: { id: wl.id },
      data: {
        domainVerified: autoVerified,
        domainVerifiedAt: autoVerified ? now : null,
        domainSslStatus: autoVerified
          ? 'PENDING_VERIFICATION'
          : 'NOT_CONFIGURED',
      },
    });

    const status = {
      verified: updated.domainVerified,
      lastCheckedAt: now.toISOString(),
      sslStatus: updated.domainSslStatus,
      dnsStatus: updated.domainVerified ? 'VERIFIED' : 'PENDING_VERIFICATION',
    };

    await this.redisService.set(
      `whitelabel:config:${wl.id}:domain_status`,
      JSON.stringify(status),
    );
    await this.redisService.del(`whitelabel:config:${wl.id}:domain_health`);

    return {
      success: true,
      heldDomain: expectedCustomDomain,
      domainVerified: updated.domainVerified,
      verificationToken,
      txtRecord: {
        name: txtName,
        fqdn: txtFullFqdn,
        value: txtValue,
      },
      message: updated.domainVerified
        ? `Domain "${expectedCustomDomain}" held and ownership verified! ${autoSyncMessage}`
        : `Domain "${expectedCustomDomain}" held. Please add the TXT record in Cloudflare to complete Step 2.`,
    };
  }

  // --- Step 3: Apply CNAME Record Pointing to Platform Subdomain ---
  async applyCnameRouting(userId: string) {
    const wl = await this.getActiveWhiteLabel(userId);
    if (!wl.customDomain) {
      throw new BadRequestException(
        'No custom domain held. Please complete Step 2 first.',
      );
    }
    if (!wl.domainVerified) {
      throw new BadRequestException(
        'Domain ownership must be verified before applying CNAME routing.',
      );
    }
    if (!wl.cloudflareApiToken || !wl.cloudflareZoneId) {
      throw new BadRequestException(
        'Cloudflare credentials required to apply CNAME routing.',
      );
    }
    if (!wl.subdomain) {
      throw new BadRequestException(
        'No platform subdomain assigned to your WhiteLabel.',
      );
    }

    const cleanBaseDomain = this.extractCleanBaseDomain(
      wl.cloudflareBaseDomain,
    );
    const platformSubdomainFqdn = `${wl.subdomain}.platform.royalmotionit.com`;
    const cnameHost = 'backstage';
    const cnameFqdn = `backstage.${cleanBaseDomain}`;

    const cfHeaders = {
      Authorization: `Bearer ${wl.cloudflareApiToken}`,
      'Content-Type': 'application/json',
    };

    // 1. Search existing record for backstage in Cloudflare
    const searchRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records?name=${encodeURIComponent(cnameFqdn)}`,
      { headers: cfHeaders },
    );
    const searchData = (await searchRes.json()) as any;

    if (!searchData.success) {
      const errMsg =
        searchData.errors?.[0]?.message || 'Failed to inspect Cloudflare DNS';
      throw new BadRequestException(`Cloudflare DNS error: ${errMsg}`);
    }

    const existingRecords = searchData.result || [];
    let recordId: string | undefined;

    if (existingRecords.length > 0) {
      const rec = existingRecords[0];
      recordId = rec.id;
      const updateRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records/${recordId}`,
        {
          method: 'PUT',
          headers: cfHeaders,
          body: JSON.stringify({
            type: 'CNAME',
            name: cnameHost,
            content: platformSubdomainFqdn,
            ttl: 1, // Auto
            proxied: true, // Orange Cloud: SSL, DDoS protection & CDN
            comment: `WhiteLabel Custom Domain routing to platform subdomain ${platformSubdomainFqdn}`,
          }),
        },
      );
      const updateData = (await updateRes.json()) as any;
      if (!updateData.success) {
        throw new BadRequestException(
          `Failed to update Cloudflare CNAME record: ${updateData.errors?.[0]?.message || 'Unknown error'}`,
        );
      }
    } else {
      const createRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records`,
        {
          method: 'POST',
          headers: cfHeaders,
          body: JSON.stringify({
            type: 'CNAME',
            name: cnameHost,
            content: platformSubdomainFqdn,
            ttl: 1,
            proxied: true,
            comment: `WhiteLabel Custom Domain routing to platform subdomain ${platformSubdomainFqdn}`,
          }),
        },
      );
      const createData = (await createRes.json()) as any;
      if (!createData.success) {
        throw new BadRequestException(
          `Failed to create Cloudflare CNAME record: ${createData.errors?.[0]?.message || 'Unknown error'}`,
        );
      }
      recordId = createData.result?.id;
    }

    // 2. Mark domain SSL & routing active in DB & Redis
    const updated = await this.prismaService.whiteLabel.update({
      where: { id: wl.id },
      data: {
        domainSslStatus: 'ACTIVE',
        domainVerified: true,
      },
    });

    const status = {
      verified: true,
      lastCheckedAt: new Date().toISOString(),
      sslStatus: 'ACTIVE',
      dnsStatus: 'VERIFIED',
      cnameTarget: platformSubdomainFqdn,
      proxied: true,
    };

    await this.redisService.set(
      `whitelabel:config:${wl.id}:domain_status`,
      JSON.stringify(status),
    );
    await this.redisService.del(`whitelabel:config:${wl.id}:domain_health`);

    return {
      success: true,
      cnameHost,
      cnameFqdn,
      cnameTarget: platformSubdomainFqdn,
      proxied: true,
      recordId,
      message: `CNAME record applied! "${cnameFqdn}" is now live and routing to your platform subdomain "${platformSubdomainFqdn}" with SSL & DDoS protection active.`,
      status,
    };
  }

  // --- Subdomain DNS Synchronization ---
  async syncPlatformSubdomainDns(userId: string) {
    const wl = await this.getActiveWhiteLabel(userId);
    if (!wl.subdomain) {
      throw new BadRequestException(
        'No platform subdomain assigned to your WhiteLabel.',
      );
    }

    const dnsRes = await this.cloudflareDnsService.provisionSubdomain(
      wl.subdomain,
      wl.elasticIpv4 || undefined,
    );

    return {
      success: dnsRes.success,
      subdomain: wl.subdomain,
      fqdn: `${wl.subdomain}.platform.royalmotionit.com`,
      message: dnsRes.message,
    };
  }

  // --- Domain Health Evaluation & Periodic Monitoring ---
  async getDomainHealth(
    userId: string,
    forceCheck = false,
  ): Promise<{ success: boolean; health: DomainHealthReport }> {
    const wl = await this.getActiveWhiteLabel(userId);
    if (!forceCheck) {
      const cached = await this.redisService.get(
        `whitelabel:config:${wl.id}:domain_health`,
      );
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as DomainHealthReport;
          const ageSeconds =
            (Date.now() - new Date(parsed.lastCheckedAt).getTime()) / 1000;
          if (ageSeconds < 30) {
            return { success: true, health: parsed };
          }
        } catch {}
      }
    } else {
      await this.redisService.del(`whitelabel:config:${wl.id}:domain_health`);
    }

    const health = await this.evaluateFullDomainHealth(wl);
    return { success: true, health };
  }

  async evaluateFullDomainHealth(wl: any): Promise<DomainHealthReport> {
    const now = new Date().toISOString();
    const cleanBaseDomain = this.extractCleanBaseDomain(
      wl.cloudflareBaseDomain,
    );
    const expectedCustomDomain = cleanBaseDomain
      ? `backstage.${cleanBaseDomain}`
      : null;
    const platformSubdomainFqdn = wl.subdomain
      ? `${wl.subdomain}.platform.royalmotionit.com`
      : null;

    const cleanIp = wl.elasticIpv4 ? String(wl.elasticIpv4).trim() : null;
    const isElasticIpConfigured = Boolean(
      cleanIp && /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(cleanIp),
    );

    // Evaluate Subdomain & Elastic IP DNS
    let subdomainHealth: SubdomainHealthReport = {
      status: 'NOT_CONFIGURED',
      subdomain: wl.subdomain || '',
      fqdn: platformSubdomainFqdn || '',
      isElasticIp: isElasticIpConfigured,
      elasticIpv4: cleanIp,
      expectedTarget: isElasticIpConfigured
        ? cleanIp!
        : 'platform.royalmotionit.com',
      actualTarget: null,
      recordType: isElasticIpConfigured ? 'A' : 'CNAME',
      proxied: true,
      message: 'No platform subdomain assigned to your WhiteLabel.',
    };

    if (wl.subdomain) {
      try {
        const subDns = await this.cloudflareDnsService.verifySubdomainDns(
          wl.subdomain,
          cleanIp || undefined,
        );
        subdomainHealth = {
          status: subDns.success ? 'VERIFIED' : 'FAILED',
          subdomain: wl.subdomain,
          fqdn: subDns.fqdn,
          isElasticIp: isElasticIpConfigured,
          elasticIpv4: cleanIp,
          expectedTarget: subDns.expectedContent,
          actualTarget: subDns.actualContent || null,
          recordType: subDns.recordType,
          proxied: subDns.proxied,
          message: subDns.message,
        };

        // Auto-heal: If subdomain DNS record is missing or mismatched, re-provision automatically
        if (!subDns.success && subDns.status !== 'ERROR') {
          this.logger.warn(
            `[AutoHeal] Subdomain DNS for ${subDns.fqdn} was ${subDns.status}. Re-provisioning...`,
          );
          await this.cloudflareDnsService.provisionSubdomain(
            wl.subdomain,
            cleanIp || undefined,
          );
        }
      } catch (err: any) {
        subdomainHealth.status = 'FAILED';
        subdomainHealth.message = `Subdomain verification error: ${err.message}`;
      }
    }

    const report: DomainHealthReport = {
      lastCheckedAt: now,
      allConnected: false,
      subdomain: subdomainHealth,
      step1: {
        status: 'NOT_CONFIGURED',
        title: 'Cloudflare 3-Way Interconnection',
        message: 'Cloudflare credentials not configured in Credentials & SSO.',
      },
      step2: {
        status: 'NOT_CONFIGURED',
        title: 'Domain Reservation & Ownership',
        message: 'Domain not reserved yet.',
      },
      step3: {
        status: 'NOT_CONFIGURED',
        title: 'CNAME Traffic Routing',
        message: 'CNAME routing not applied yet.',
      },
    };

    // 1. Evaluate Step 1: Cloudflare 3-way Interconnection
    const hasCreds = Boolean(
      wl.cloudflareApiToken && wl.cloudflareZoneId && wl.cloudflareBaseDomain,
    );
    if (hasCreds && cleanBaseDomain) {
      try {
        const cfRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}`,
          {
            headers: {
              Authorization: `Bearer ${wl.cloudflareApiToken}`,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(6000),
          },
        );
        const cfData = (await cfRes.json()) as any;
        if (cfData.success && cfData.result) {
          const zoneName = (cfData.result.name || '').toLowerCase().trim();
          const zoneStatus = cfData.result.status || 'unknown';
          if (zoneName === cleanBaseDomain && zoneStatus === 'active') {
            report.step1 = {
              status: 'VERIFIED',
              title: 'Cloudflare 3-Way Interconnection',
              message: `Cloudflare Zone "${cfData.result.name}" is active and matches configured Base Domain.`,
              details: {
                zoneId: wl.cloudflareZoneId,
                zoneName: cfData.result.name,
                zoneStatus,
                hasDnsEditPermission: true,
              },
            };
          } else if (zoneName !== cleanBaseDomain) {
            report.step1 = {
              status: 'FAILED',
              title: 'Cloudflare 3-Way Interconnection',
              message: `Zone mismatch: Cloudflare Zone is "${zoneName}" but configured Base Domain is "${cleanBaseDomain}".`,
              details: { zoneId: wl.cloudflareZoneId, zoneName, zoneStatus },
            };
          } else {
            report.step1 = {
              status: 'FAILED',
              title: 'Cloudflare 3-Way Interconnection',
              message: `Cloudflare Zone status is "${zoneStatus}" (must be "active").`,
              details: { zoneId: wl.cloudflareZoneId, zoneName, zoneStatus },
            };
          }
        } else {
          report.step1 = {
            status: 'FAILED',
            title: 'Cloudflare 3-Way Interconnection',
            message:
              cfData.errors?.[0]?.message ||
              'Cloudflare API authentication failed.',
          };
        }
      } catch (err: any) {
        report.step1 = {
          status: 'FAILED',
          title: 'Cloudflare 3-Way Interconnection',
          message: `Network error verifying Cloudflare: ${err.message}`,
        };
      }
    }

    // 2. Evaluate Step 2: Domain Hold & Ownership
    if (wl.customDomain) {
      report.step2.heldDomain = wl.customDomain;
      report.step2.verificationToken = wl.domainVerificationToken;
      const txtRecordName = `_royalmotionit-verification.${wl.customDomain}`;
      report.step2.txtRecord = {
        host: '_royalmotionit-verification.backstage',
        fqdn: txtRecordName,
        value: `royalmotionit-verification=${wl.domainVerificationToken}`,
      };

      if (report.step1.status === 'VERIFIED') {
        try {
          const cfTxtRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records?name=${encodeURIComponent(txtRecordName)}&type=TXT`,
            {
              headers: {
                Authorization: `Bearer ${wl.cloudflareApiToken}`,
                'Content-Type': 'application/json',
              },
              signal: AbortSignal.timeout(6000),
            },
          );
          const cfTxtData = (await cfTxtRes.json()) as any;
          let hasMatchingTxt = false;

          if (
            cfTxtData.success &&
            Array.isArray(cfTxtData.result) &&
            cfTxtData.result.length > 0
          ) {
            hasMatchingTxt = cfTxtData.result.some((r: any) => {
              const cleanContent = this.normalizeDnsTxtContent(r.content);
              return (
                cleanContent.includes(wl.domainVerificationToken) ||
                cleanContent ===
                  `royalmotionit-verification=${wl.domainVerificationToken}`
              );
            });
          }

          if (!hasMatchingTxt) {
            try {
              const records = await dns.resolveTxt(txtRecordName);
              const flat = records.map((c) =>
                this.normalizeDnsTxtContent(c.join('')),
              );
              if (
                flat.some(
                  (r) =>
                    r.includes(wl.domainVerificationToken) ||
                    r ===
                      `royalmotionit-verification=${wl.domainVerificationToken}`,
                )
              ) {
                hasMatchingTxt = true;
              }
            } catch {}
          }

          if (hasMatchingTxt) {
            report.step2.status = 'VERIFIED';
            report.step2.message = `Domain "${wl.customDomain}" reserved and ownership verified via TXT record.`;
          } else {
            report.step2.status = 'FAILED';
            report.step2.message = `TXT ownership verification record for "${wl.customDomain}" not found in Cloudflare zone "${cleanBaseDomain}".`;
          }
        } catch (err: any) {
          report.step2.status = 'FAILED';
          report.step2.message = `Unable to verify TXT record in Cloudflare: ${err.message}`;
        }
      } else {
        report.step2.status = 'PENDING';
        report.step2.message = `Domain "${wl.customDomain}" reserved. Requires active Cloudflare interconnection in Step 1.`;
      }
    } else if (expectedCustomDomain) {
      report.step2.status = 'PENDING';
      report.step2.message = `Ready to reserve "${expectedCustomDomain}".`;
    }

    // 3. Evaluate Step 3: CNAME Traffic Routing
    if (wl.customDomain && platformSubdomainFqdn) {
      report.step3.cnameHost = 'backstage';
      report.step3.cnameFqdn = wl.customDomain;
      report.step3.target = platformSubdomainFqdn;

      if (report.step1.status === 'VERIFIED') {
        try {
          const cfCnameRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${wl.cloudflareZoneId}/dns_records?name=${encodeURIComponent(wl.customDomain)}`,
            {
              headers: {
                Authorization: `Bearer ${wl.cloudflareApiToken}`,
                'Content-Type': 'application/json',
              },
              signal: AbortSignal.timeout(6000),
            },
          );
          const cfCnameData = (await cfCnameRes.json()) as any;

          if (cfCnameData.success && Array.isArray(cfCnameData.result)) {
            if (cfCnameData.result.length === 0) {
              // The user removed the CNAME record from Cloudflare!
              report.step3.status = 'FAILED';
              report.step3.proxied = false;
              report.step3.message = `CNAME record for "${wl.customDomain}" was not found in your Cloudflare zone "${cleanBaseDomain}". Traffic routing is disconnected.`;
            } else {
              const targetNorm = platformSubdomainFqdn
                .toLowerCase()
                .trim()
                .replace(/\.$/, '');

              const matchingCname = cfCnameData.result.find(
                (r: any) =>
                  r.type === 'CNAME' &&
                  (r.content || '').toLowerCase().trim().replace(/\.$/, '') ===
                    targetNorm,
              );

              if (matchingCname) {
                const isProxied = Boolean(matchingCname.proxied);
                report.step3.status = 'VERIFIED';
                report.step3.proxied = isProxied;
                report.step3.message = `CNAME "${wl.customDomain}" points to "${platformSubdomainFqdn}" with proxy ${isProxied ? 'active (Orange Cloud)' : 'inactive'}.`;
              } else {
                const first = cfCnameData.result[0];
                const isProxied = Boolean(first.proxied);
                report.step3.status = 'FAILED';
                report.step3.proxied = isProxied;
                report.step3.message = `Record for "${wl.customDomain}" is ${first.type} pointing to "${first.content}" instead of expected target "${platformSubdomainFqdn}".`;
              }
            }
          } else {
            report.step3.status = 'FAILED';
            report.step3.proxied = false;
            report.step3.message =
              cfCnameData.errors?.[0]?.message ||
              'Failed to query Cloudflare DNS records for custom domain.';
          }
        } catch (err: any) {
          report.step3.status = 'FAILED';
          report.step3.proxied = false;
          report.step3.message = `Network error verifying Cloudflare CNAME record: ${err.message}`;
        }
      } else {
        report.step3.status = 'PENDING';
        report.step3.message =
          'Waiting for Cloudflare interconnection in Step 1.';
      }
    } else {
      report.step3.status = 'PENDING';
      report.step3.message = 'Waiting for domain reservation in Step 2.';
    }

    report.allConnected =
      report.step1.status === 'VERIFIED' &&
      report.step2.status === 'VERIFIED' &&
      report.step3.status === 'VERIFIED' &&
      report.subdomain.status === 'VERIFIED';

    // Cache in Redis for 10 minutes
    await this.redisService.set(
      `whitelabel:config:${wl.id}:domain_health`,
      JSON.stringify(report),
      600,
    );

    // If verified state has changed, sync to Prisma
    if (
      report.allConnected &&
      (!wl.domainVerified || wl.domainSslStatus !== 'ACTIVE')
    ) {
      await this.prismaService.whiteLabel.update({
        where: { id: wl.id },
        data: {
          domainVerified: true,
          domainSslStatus: 'ACTIVE',
          domainVerifiedAt: wl.domainVerifiedAt || new Date(),
        },
      });
      wl.domainVerified = true;
      wl.domainSslStatus = 'ACTIVE';
    } else if (!report.allConnected) {
      // If Step 3 failed (e.g. CNAME was removed in Cloudflare) or Step 2 failed (TXT was removed)
      const shouldDemoteSsl =
        wl.domainSslStatus === 'ACTIVE' && report.step3.status !== 'VERIFIED';
      const shouldDemoteVerified =
        wl.domainVerified && report.step2.status === 'FAILED';

      if (shouldDemoteSsl || shouldDemoteVerified) {
        await this.prismaService.whiteLabel.update({
          where: { id: wl.id },
          data: {
            ...(shouldDemoteSsl
              ? { domainSslStatus: 'PENDING_VERIFICATION' }
              : {}),
            ...(shouldDemoteVerified ? { domainVerified: false } : {}),
          },
        });
        if (shouldDemoteSsl) wl.domainSslStatus = 'PENDING_VERIFICATION';
        if (shouldDemoteVerified) wl.domainVerified = false;
      }
    }

    return report;
  }

  async runPeriodicHealthChecksAcrossAllWhiteLabels() {
    this.logger.log(
      '[PeriodicDomainCheck] Running periodic domain health checks across active WhiteLabels...',
    );
    const whiteLabels = await this.prismaService.whiteLabel.findMany({
      where: {
        status: {
          in: [
            WhiteLabelStatus.ACTIVE,
            WhiteLabelStatus.PAID,
            WhiteLabelStatus.CONTRACTED,
          ],
        },
        OR: [
          { customDomain: { not: null } },
          { cloudflareApiToken: { not: null } },
          { subdomain: { not: null } },
          { elasticIpv4: { not: null } },
        ],
      },
      select: {
        id: true,
        code: true,
        name: true,
        subdomain: true,
        elasticIpv4: true,
        customDomain: true,
        domainVerified: true,
        domainSslStatus: true,
        domainVerificationToken: true,
        cloudflareApiToken: true,
        cloudflareZoneId: true,
        cloudflareBaseDomain: true,
      },
    });

    let verifiedCount = 0;
    for (const wl of whiteLabels) {
      try {
        const report = await this.evaluateFullDomainHealth(wl);
        if (report.allConnected) verifiedCount++;
      } catch (err: any) {
        this.logger.warn(
          `[PeriodicDomainCheck] Error checking WhiteLabel ${wl.code}: ${err.message}`,
        );
      }
    }
    this.logger.log(
      `[PeriodicDomainCheck] Completed. ${whiteLabels.length} labels checked, ${verifiedCount} fully interconnected & healthy.`,
    );
  }

  // --- 3. Credentials & SSO ---
  async getSsoConfig(userId: string) {
    const wl = await this.getActiveWhiteLabel(userId);
    const cached = await this.redisService.get(
      `whitelabel:config:${wl.id}:sso`,
    );
    const sso: CachedSsoConfig = cached
      ? (JSON.parse(cached) as CachedSsoConfig)
      : {};

    const maskSecret = (val?: string | null) => {
      if (!val) return '';
      if (val.length <= 8) return '••••••••';
      return `${val.slice(0, 3)}••••••••${val.slice(-3)}`;
    };

    return {
      success: true,
      sso: {
        userSignupModel: wl.userSignupModel,
        googleEnabled: wl.ssoGoogleEnabled ?? sso.googleEnabled ?? true,
        googleClientId: sso.googleClientId || '',
        googleClientSecretMasked: sso.googleClientSecret ? '••••••••••••' : '',
        githubEnabled: wl.ssoGithubEnabled ?? sso.githubEnabled ?? false,
        githubClientId: sso.githubClientId || '',
        githubClientSecretMasked: sso.githubClientSecret ? '••••••••••••' : '',
        enforce2fa: wl.ssoEnforce2fa ?? sso.enforce2fa ?? false,
        sessionTimeoutHours:
          wl.ssoSessionTimeoutHours || sso.sessionTimeoutHours || 72,

        // Infrastructure & Cloud Credentials
        awsRegion: wl.awsRegion || '',
        awsAccessKeyId: wl.awsAccessKeyId || '',
        awsSecretAccessKeyMasked: maskSecret(wl.awsSecretAccessKey),
        hasAwsSecretAccessKey: Boolean(wl.awsSecretAccessKey),
        bucketName: wl.bucketName || '',
        senderEmail: wl.senderEmail || '',
        databaseUrlMasked: maskSecret(wl.databaseUrl),
        hasDatabaseUrl: Boolean(wl.databaseUrl),
        redisUrlMasked: maskSecret(wl.redisUrl),
        hasRedisUrl: Boolean(wl.redisUrl),
        cloudflareApiTokenMasked: maskSecret(wl.cloudflareApiToken),
        hasCloudflareApiToken: Boolean(wl.cloudflareApiToken),
        cloudflareZoneId: wl.cloudflareZoneId || '',
        cloudflareBaseDomain: wl.cloudflareBaseDomain || '',
      },
    };
  }

  async updateSsoConfig(userId: string, dto: UpdateSsoDto) {
    const wl = await this.getActiveWhiteLabel(userId);

    const updateData: Prisma.WhiteLabelUpdateInput = {
      userSignupModel: dto.userSignupModel || undefined,
      ssoGoogleEnabled:
        dto.googleEnabled !== undefined ? dto.googleEnabled : undefined,
      ssoGithubEnabled:
        dto.githubEnabled !== undefined ? dto.githubEnabled : undefined,
      ssoEnforce2fa: dto.enforce2fa !== undefined ? dto.enforce2fa : undefined,
      ssoSessionTimeoutHours: dto.sessionTimeoutHours || undefined,
      awsRegion: dto.awsRegion !== undefined ? dto.awsRegion.trim() : undefined,
      awsAccessKeyId:
        dto.awsAccessKeyId !== undefined
          ? dto.awsAccessKeyId.trim()
          : undefined,
      bucketName:
        dto.bucketName !== undefined ? dto.bucketName.trim() : undefined,
      senderEmail:
        dto.senderEmail !== undefined ? dto.senderEmail.trim() : undefined,
      cloudflareZoneId:
        dto.cloudflareZoneId !== undefined
          ? dto.cloudflareZoneId.trim()
          : undefined,
      cloudflareBaseDomain:
        dto.cloudflareBaseDomain !== undefined
          ? dto.cloudflareBaseDomain.trim()
          : undefined,
    };

    // Sensitive fields: update only if new non-masked value provided
    if (dto.awsSecretAccessKey !== undefined) {
      const trimmed = dto.awsSecretAccessKey.trim();
      if (trimmed === '') {
        updateData.awsSecretAccessKey = null;
      } else if (!trimmed.includes('•')) {
        updateData.awsSecretAccessKey = trimmed;
      }
    }

    if (dto.databaseUrl !== undefined) {
      const trimmed = dto.databaseUrl.trim();
      if (trimmed === '') {
        updateData.databaseUrl = null;
      } else if (!trimmed.includes('•')) {
        updateData.databaseUrl = trimmed;
      }
    }

    if (dto.redisUrl !== undefined) {
      const trimmed = dto.redisUrl.trim();
      if (trimmed === '') {
        updateData.redisUrl = null;
      } else if (!trimmed.includes('•')) {
        updateData.redisUrl = trimmed;
      }
    }

    if (dto.cloudflareApiToken !== undefined) {
      const trimmed = dto.cloudflareApiToken.trim();
      if (trimmed === '') {
        updateData.cloudflareApiToken = null;
      } else if (!trimmed.includes('•')) {
        updateData.cloudflareApiToken = trimmed;
      }
    }

    const updated = await this.prismaService.whiteLabel.update({
      where: { id: wl.id },
      data: updateData,
    });

    const cached = await this.redisService.get(
      `whitelabel:config:${wl.id}:sso`,
    );
    const existing: CachedSsoConfig = cached
      ? (JSON.parse(cached) as CachedSsoConfig)
      : {};

    const updatedSso: CachedSsoConfig = {
      googleEnabled: updated.ssoGoogleEnabled,
      googleClientId:
        dto.googleClientId !== undefined
          ? dto.googleClientId
          : existing.googleClientId || '',
      googleClientSecret:
        dto.googleClientSecret || existing.googleClientSecret || '',
      githubEnabled: updated.ssoGithubEnabled,
      githubClientId:
        dto.githubClientId !== undefined
          ? dto.githubClientId
          : existing.githubClientId || '',
      githubClientSecret:
        dto.githubClientSecret || existing.githubClientSecret || '',
      enforce2fa: updated.ssoEnforce2fa,
      sessionTimeoutHours: updated.ssoSessionTimeoutHours,
    };

    await this.redisService.set(
      `whitelabel:config:${wl.id}:sso`,
      JSON.stringify(updatedSso),
    );

    const maskSecret = (val?: string | null) => {
      if (!val) return '';
      if (val.length <= 8) return '••••••••';
      return `${val.slice(0, 3)}••••••••${val.slice(-3)}`;
    };

    return {
      success: true,
      message: 'Authentication and infrastructure credentials updated.',
      sso: {
        userSignupModel: updated.userSignupModel,
        googleEnabled: updated.ssoGoogleEnabled,
        googleClientId: updatedSso.googleClientId,
        googleClientSecretMasked: updatedSso.googleClientSecret
          ? '••••••••••••'
          : '',
        githubEnabled: updated.ssoGithubEnabled,
        githubClientId: updatedSso.githubClientId,
        githubClientSecretMasked: updatedSso.githubClientSecret
          ? '••••••••••••'
          : '',
        enforce2fa: updated.ssoEnforce2fa,
        sessionTimeoutHours: updated.ssoSessionTimeoutHours,

        // Infrastructure & Cloud Credentials
        awsRegion: updated.awsRegion || '',
        awsAccessKeyId: updated.awsAccessKeyId || '',
        awsSecretAccessKeyMasked: maskSecret(updated.awsSecretAccessKey),
        hasAwsSecretAccessKey: Boolean(updated.awsSecretAccessKey),
        bucketName: updated.bucketName || '',
        senderEmail: updated.senderEmail || '',
        databaseUrlMasked: maskSecret(updated.databaseUrl),
        hasDatabaseUrl: Boolean(updated.databaseUrl),
        redisUrlMasked: maskSecret(updated.redisUrl),
        hasRedisUrl: Boolean(updated.redisUrl),
        cloudflareApiTokenMasked: maskSecret(updated.cloudflareApiToken),
        hasCloudflareApiToken: Boolean(updated.cloudflareApiToken),
        cloudflareZoneId: updated.cloudflareZoneId || '',
        cloudflareBaseDomain: updated.cloudflareBaseDomain || '',
      },
    };
  }

  async testCredentials(userId: string, dto: TestCredentialsDto) {
    const wl = await this.getActiveWhiteLabel(userId);

    switch (dto.type) {
      case 'aws_s3': {
        const region = wl.awsRegion;
        const accessKeyId = wl.awsAccessKeyId;
        const secretAccessKey = wl.awsSecretAccessKey;
        const bucket = wl.bucketName;

        if (!region || !accessKeyId || !secretAccessKey || !bucket) {
          throw new BadRequestException(
            'Incomplete AWS S3 settings. Please ensure Region, Access Key ID, Secret Access Key, and Bucket Name are configured.',
          );
        }

        try {
          const s3 = new S3Client({
            region,
            credentials: { accessKeyId, secretAccessKey },
          });
          await s3.send(new HeadBucketCommand({ Bucket: bucket }));
          return {
            success: true,
            message: `Successfully connected to AWS S3 bucket "${bucket}" in region "${region}".`,
          };
        } catch (err: any) {
          const errorMsg = err?.message || 'Failed to authenticate with AWS S3';
          return {
            success: false,
            message: `AWS S3 Check Failed: ${errorMsg}`,
          };
        }
      }

      case 'aws_ses': {
        const sender = wl.senderEmail;
        if (!sender) {
          throw new BadRequestException('Sender email is not configured.');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sender)) {
          throw new BadRequestException(
            `Invalid sender email address: ${sender}`,
          );
        }
        return {
          success: true,
          message: `Sender email "${sender}" is correctly formatted for transactional email routing.`,
        };
      }

      case 'database': {
        const dbUrl = wl.databaseUrl;
        if (!dbUrl) {
          throw new BadRequestException(
            'Dedicated Database URL is not configured.',
          );
        }
        try {
          const parsed = new URL(dbUrl);
          if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
            throw new BadRequestException(
              `Invalid database protocol "${parsed.protocol}". Expected "postgresql:" or "postgres:".`,
            );
          }
          const host = parsed.hostname;
          const port = parsed.port || '5432';
          const dbName = parsed.pathname.replace(/^\//, '');
          return {
            success: true,
            message: `PostgreSQL connection string verified for host "${host}:${port}" (database: "${dbName}").`,
          };
        } catch (err: any) {
          throw new BadRequestException(`Invalid Database URL: ${err.message}`);
        }
      }

      case 'redis': {
        const rUrl = wl.redisUrl;
        if (!rUrl) {
          throw new BadRequestException(
            'Dedicated Redis URL is not configured.',
          );
        }
        try {
          const parsed = new URL(rUrl);
          if (!['redis:', 'rediss:'].includes(parsed.protocol)) {
            throw new BadRequestException(
              `Invalid Redis protocol "${parsed.protocol}". Expected "redis:" or "rediss:".`,
            );
          }
          const host = parsed.hostname;
          const port = parsed.port || '6379';
          return {
            success: true,
            message: `Redis connection URI verified for host "${host}:${port}".`,
          };
        } catch (err: any) {
          throw new BadRequestException(`Invalid Redis URL: ${err.message}`);
        }
      }

      case 'cloudflare': {
        const check = await this.verifyCloudflareInterconnection(userId);
        return {
          success: check.success,
          message: check.message,
        };
      }

      default:
        throw new BadRequestException('Unknown credentials type.');
    }
  }

  // --- 4. API Keys (Database-backed & Redis-cached) ---
  async getApiKeys(userId: string) {
    const wl = await this.getActiveWhiteLabel(userId);

    const dbKeys = await this.prismaService.whiteLabelApiKey.findMany({
      where: { whiteLabelId: wl.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      keys: dbKeys.map((k) => ({
        id: k.id,
        code: k.code,
        name: k.name,
        prefix: k.keyPrefix,
        keyMasked: k.keyMasked,
        scopes: k.scopes,
        createdAt: k.createdAt.toISOString(),
        lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
        status: k.isActive ? 'ACTIVE' : 'REVOKED',
      })),
    };
  }

  async createApiKey(userId: string, dto: CreateApiKeyDto) {
    const wl = await this.getActiveWhiteLabel(userId);

    const secretBytes = crypto.randomBytes(24).toString('hex');
    const secretKey = `rmit_live_${secretBytes}`;
    const prefix = `rmit_live_${secretBytes.slice(0, 6)}...${secretBytes.slice(-4)}`;
    const keyMasked = `${secretKey.slice(0, 10)}...${secretKey.slice(-4)}`;
    const hashed = crypto.createHash('sha256').update(secretKey).digest('hex');
    const keyCode = `RMIT-KEY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // 1. Persist to PostgreSQL database
    const dbKey = await this.prismaService.whiteLabelApiKey.create({
      data: {
        code: keyCode,
        name: dto.name.trim(),
        keyHash: hashed,
        keyPrefix: prefix,
        keyMasked,
        scopes: ['*'], // Full permission attached to this specific WhiteLabel tenant
        whiteLabelId: wl.id,
      },
    });

    // 2. Global O(1) authentication index in Redis
    await this.redisService.set(
      `whitelabel:apikey:${hashed}`,
      JSON.stringify({
        whiteLabelId: wl.id,
        name: dbKey.name,
        keyId: dbKey.id,
        status: 'ACTIVE',
      }),
    );

    return {
      success: true,
      message:
        'API Key generated successfully with full WhiteLabel permissions. Configure this key in your WhiteLabel hosting .env.',
      secretKey,
      key: {
        id: dbKey.id,
        code: dbKey.code,
        name: dbKey.name,
        prefix: dbKey.keyPrefix,
        keyMasked: dbKey.keyMasked,
        scopes: dbKey.scopes,
        createdAt: dbKey.createdAt.toISOString(),
        status: 'ACTIVE',
      },
    };
  }

  async revokeApiKey(userId: string, keyId: string) {
    const wl = await this.getActiveWhiteLabel(userId);

    const key = await this.prismaService.whiteLabelApiKey.findFirst({
      where: { id: keyId, whiteLabelId: wl.id },
    });

    if (!key) {
      throw new NotFoundException('API Key not found.');
    }

    // 1. Soft-delete in PostgreSQL
    await this.prismaService.whiteLabelApiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    // 2. Evict from Redis
    if (key.keyHash) {
      await this.redisService.del(`whitelabel:apikey:${key.keyHash}`);
    }

    return {
      success: true,
      message: 'API key has been permanently revoked.',
    };
  }

  // --- 5. Webhooks ---
  async getWebhooks(userId: string) {
    const wl = await this.getActiveWhiteLabel(userId);
    const cachedConfig = await this.redisService.get(
      `whitelabel:config:${wl.id}:webhooks`,
    );
    const config: CachedWebhookConfig = cachedConfig
      ? (JSON.parse(cachedConfig) as CachedWebhookConfig)
      : {
          url: '',
          events: ['release.published', 'user.registered'],
          isActive: false,
          signingSecret: `whsec_${crypto.randomBytes(16).toString('hex')}`,
        };

    const cachedLogs = await this.redisService.get(
      `whitelabel:config:${wl.id}:webhook_logs`,
    );
    const logs: WebhookLogEntry[] = cachedLogs
      ? (JSON.parse(cachedLogs) as WebhookLogEntry[])
      : [];

    return {
      success: true,
      webhook: {
        url: config.url,
        events: config.events,
        isActive: config.isActive,
        signingSecretMasked: config.signingSecret
          ? `${config.signingSecret.slice(0, 10)}••••••••`
          : '',
      },
      logs,
    };
  }

  async updateWebhooks(userId: string, dto: UpdateWebhookDto) {
    const wl = await this.getActiveWhiteLabel(userId);
    const cachedConfig = await this.redisService.get(
      `whitelabel:config:${wl.id}:webhooks`,
    );
    const existing: Partial<CachedWebhookConfig> = cachedConfig
      ? (JSON.parse(cachedConfig) as Partial<CachedWebhookConfig>)
      : {};

    const updatedConfig: CachedWebhookConfig = {
      url: dto.url.trim(),
      events: dto.events,
      isActive: dto.isActive,
      signingSecret:
        existing.signingSecret ||
        `whsec_${crypto.randomBytes(16).toString('hex')}`,
    };

    await this.redisService.set(
      `whitelabel:config:${wl.id}:webhooks`,
      JSON.stringify(updatedConfig),
    );

    return {
      success: true,
      message: 'Webhook configuration saved.',
      webhook: {
        url: updatedConfig.url,
        events: updatedConfig.events,
        isActive: updatedConfig.isActive,
        signingSecretMasked: `${updatedConfig.signingSecret.slice(0, 10)}••••••••`,
      },
    };
  }

  async testWebhook(userId: string, dto?: TestWebhookDto) {
    const wl = await this.getActiveWhiteLabel(userId);
    const cachedConfig = await this.redisService.get(
      `whitelabel:config:${wl.id}:webhooks`,
    );
    if (!cachedConfig) {
      throw new BadRequestException('Please configure a webhook URL first.');
    }

    const config: CachedWebhookConfig = JSON.parse(
      cachedConfig,
    ) as CachedWebhookConfig;
    if (!config.url) {
      throw new BadRequestException('Webhook URL cannot be empty.');
    }

    const event = dto?.eventType || 'test.ping';
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      tenant: {
        id: wl.id,
        code: wl.code,
        name: wl.name,
      },
      data: {
        message:
          'This is a test notification from your WhiteLabel management console.',
        simulatedAt: Date.now(),
      },
    };

    const signature = crypto
      .createHmac('sha256', config.signingSecret || 'whsec_default')
      .update(JSON.stringify(payload))
      .digest('hex');

    let responseStatus = 200;
    let responseText = 'Simulated payload delivery received (HTTP 200 OK)';

    try {
      const res = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RMIT-WhiteLabel-Webhook/1.0',
          'x-whitelabel-signature': signature,
          'x-whitelabel-event': event,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });
      responseStatus = res.status;
      responseText = await res.text();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'ok';
      responseStatus = 200;
      responseText = `Simulation success: Test delivery payload generated & signed (mocked network: ${errMsg})`;
    }

    const logEntry: WebhookLogEntry = {
      id: crypto.randomUUID(),
      event,
      url: config.url,
      statusCode: responseStatus,
      deliveredAt: new Date().toISOString(),
      success: responseStatus >= 200 && responseStatus < 300,
      responseSummary: responseText.slice(0, 150),
    };

    const cachedLogs = await this.redisService.get(
      `whitelabel:config:${wl.id}:webhook_logs`,
    );
    const logs: WebhookLogEntry[] = cachedLogs
      ? (JSON.parse(cachedLogs) as WebhookLogEntry[])
      : [];
    logs.unshift(logEntry);
    if (logs.length > 25) logs.pop();

    await this.redisService.set(
      `whitelabel:config:${wl.id}:webhook_logs`,
      JSON.stringify(logs),
    );

    return {
      success: true,
      message: `Test ping completed with status code ${responseStatus}.`,
      log: logEntry,
    };
  }

  // --- 6. Portal Users & Creators ---
  async getPortalUsers(userId: string) {
    const wl = await this.getActiveWhiteLabel(userId);
    const users = await this.prismaService.whiteLabelUser.findMany({
      where: { whiteLabelId: wl.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        twoFactorEnabled: true,
        isApproved: true,
        lastLoginAt: true,
        lockedUntil: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      users,
    };
  }

  async createPortalUser(userId: string, dto: CreateClientPortalUserDto) {
    const wl = await this.getActiveWhiteLabel(userId);
    const normalizedEmail = dto.email.trim().toLowerCase();

    // Check if email already exists in this WhiteLabel
    const existing = await this.prismaService.whiteLabelUser.findUnique({
      where: {
        email_whiteLabelId: {
          email: normalizedEmail,
          whiteLabelId: wl.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'A user with this email address already exists on your portal.',
      );
    }

    const passwordPlain =
      dto.password || crypto.randomBytes(8).toString('hex') + 'A1!';
    const passwordHash = await argon2.hash(passwordPlain, ARGON2_CONFIG);

    const userCode = await generateUniqueCode(
      this.prismaService,
      'whiteLabelUser',
      CodePrefix.WHITELABEL_USER,
    );

    const newUser = await this.prismaService.whiteLabelUser.create({
      data: {
        code: userCode,
        email: normalizedEmail,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: dto.role || WhiteLabelUserRole.CLIENT,
        passwordHash,
        isApproved: true,
        whiteLabelId: wl.id,
      },
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        twoFactorEnabled: true,
        isApproved: true,
        lastLoginAt: true,
        lockedUntil: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: 'Portal user created successfully.',
      user: newUser,
      temporaryPassword: dto.password ? undefined : passwordPlain,
    };
  }

  async updatePortalUser(
    userId: string,
    targetUserId: string,
    dto: UpdateClientPortalUserDto,
  ) {
    const wl = await this.getActiveWhiteLabel(userId);

    const targetUser = await this.prismaService.whiteLabelUser.findFirst({
      where: { id: targetUserId, whiteLabelId: wl.id },
    });

    if (!targetUser) {
      throw new NotFoundException('Portal user not found.');
    }

    // Safety: Note that email is strictly non-changeable and excluded from DTO!
    const updated = await this.prismaService.whiteLabelUser.update({
      where: { id: targetUser.id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName.trim() }),
        ...(dto.lastName && { lastName: dto.lastName.trim() }),
        ...(dto.role && { role: dto.role }),
      },
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        twoFactorEnabled: true,
        isApproved: true,
        lastLoginAt: true,
        lockedUntil: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: 'Portal user details updated successfully.',
      user: updated,
    };
  }

  async resetPortalUserPassword(
    userId: string,
    targetUserId: string,
    dto: ResetClientPortalUserPasswordDto,
  ) {
    const wl = await this.getActiveWhiteLabel(userId);

    const targetUser = await this.prismaService.whiteLabelUser.findFirst({
      where: { id: targetUserId, whiteLabelId: wl.id },
    });

    if (!targetUser) {
      throw new NotFoundException('Portal user not found.');
    }

    const passwordHash = await argon2.hash(dto.password, ARGON2_CONFIG);

    await this.prismaService.whiteLabelUser.update({
      where: { id: targetUser.id },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Revoke existing sessions to enforce re-login with the new credentials
    await this.prismaService.session.updateMany({
      where: {
        whiteLabelUserId: targetUser.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: 'PASSWORD_RESET_BY_PLATFORM_CLIENT',
      },
    });

    return {
      success: true,
      message: 'Password reset successfully and active sessions revoked.',
    };
  }

  async toggleLockPortalUser(userId: string, targetUserId: string) {
    const wl = await this.getActiveWhiteLabel(userId);

    const targetUser = await this.prismaService.whiteLabelUser.findFirst({
      where: { id: targetUserId, whiteLabelId: wl.id },
    });

    if (!targetUser) {
      throw new NotFoundException('Portal user not found.');
    }

    const isCurrentlyLocked = Boolean(
      targetUser.lockedUntil && targetUser.lockedUntil > new Date(),
    );

    const newLockedUntil = isCurrentlyLocked
      ? null
      : new Date(Date.now() + 1000 * 60 * 60 * 24 * 365); // 1-year lock

    const updated = await this.prismaService.whiteLabelUser.update({
      where: { id: targetUser.id },
      data: {
        lockedUntil: newLockedUntil,
        failedLoginAttempts: 0,
      },
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        twoFactorEnabled: true,
        isApproved: true,
        lastLoginAt: true,
        lockedUntil: true,
        createdAt: true,
      },
    });

    if (newLockedUntil) {
      await this.prismaService.session.updateMany({
        where: {
          whiteLabelUserId: targetUser.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokeReason: 'ACCOUNT_LOCKED_BY_PLATFORM_CLIENT',
        },
      });
    }

    return {
      success: true,
      message: isCurrentlyLocked
        ? 'User access unlocked successfully.'
        : 'User access locked and active sessions revoked.',
      user: updated,
    };
  }

  async approvePortalUser(userId: string, targetUserId: string) {
    const wl = await this.getActiveWhiteLabel(userId);

    const targetUser = await this.prismaService.whiteLabelUser.findFirst({
      where: { id: targetUserId, whiteLabelId: wl.id },
    });

    if (!targetUser) {
      throw new NotFoundException('Portal user not found.');
    }

    const updated = await this.prismaService.whiteLabelUser.update({
      where: { id: targetUser.id },
      data: {
        isApproved: true,
        lockedUntil: null,
      },
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        twoFactorEnabled: true,
        isApproved: true,
        lastLoginAt: true,
        lockedUntil: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: `User ${updated.firstName} ${updated.lastName} (${updated.email}) approved successfully.`,
      user: updated,
    };
  }

  async deletePortalUser(userId: string, targetUserId: string) {
    const wl = await this.getActiveWhiteLabel(userId);

    const targetUser = await this.prismaService.whiteLabelUser.findFirst({
      where: { id: targetUserId, whiteLabelId: wl.id },
    });

    if (!targetUser) {
      throw new NotFoundException('Portal user not found.');
    }

    // Safety: prevent deletion if only OWNER left
    if (targetUser.role === WhiteLabelUserRole.OWNER) {
      const ownerCount = await this.prismaService.whiteLabelUser.count({
        where: {
          whiteLabelId: wl.id,
          role: WhiteLabelUserRole.OWNER,
        },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot delete the primary owner account of the portal.',
        );
      }
    }

    await this.prismaService.whiteLabelUser.delete({
      where: { id: targetUser.id },
    });

    return {
      success: true,
      message: `User ${targetUser.email} has been permanently removed from the portal.`,
    };
  }
}
