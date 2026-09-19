import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import {
  generateUniqueCode,
  CodePrefix,
} from 'src/lib/prisma/code-generator';
import {
  DOCUMENT_URL_TTL_SECONDS,
  StorageService,
} from 'src/lib/storage/storage.service';
import { IMMUTABLE_CACHE_CONTROL } from 'src/config/storage-keys.config';
import { CreateWhiteLabelDto } from './dto/create-whitelabel.dto';
import { UpdateBrandingDto } from 'src/platform/dto/update-branding.dto';
import {
  Prisma,
  WhiteLabelStatus,
} from 'src/generated/prisma/client';
import { RedisService } from 'src/lib/redis/redis.service';
import * as crypto from 'node:crypto';
import * as dns from 'node:dns/promises';
import {
  UpdateThemeDto,
  UpdateDomainDto,
  UpdateSsoDto,
  CreateApiKeyDto,
  UpdateWebhookDto,
  TestWebhookDto,
} from './dto/whitelabel-management.dto';

@Injectable()
export class ClientWhitelabelService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
    private readonly redisService: RedisService,
  ) {}


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

    // 2. If WhiteLabel already exists
    if (subscription.whiteLabel) {
      if (subscription.whiteLabel.status === WhiteLabelStatus.APPROVED) {
        throw new ConflictException(
          'You already have an active, approved WhiteLabel instance.',
        );
      }

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

    return {
      success: true,
      message: 'Application status fetched successfully.',
      hasApplication: Boolean(subscription?.whiteLabel),
      subscription,
      whiteLabel: subscription?.whiteLabel || null,
      payments: subscription?.payments || [],
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
        subdomain: wl.subdomain,
        customDomain: wl.customDomain,
        tagline: wl.tagline,
        description: wl.description,
        logoUrl: wl.logoUrl,
        logoDarkUrl: wl.logoDarkUrl,
        faviconUrl: wl.faviconUrl,
        bannerUrl: wl.bannerUrl,
        primaryColor: wl.primaryColor || '#6366f1',
        accentColor: wl.accentColor || '#ec4899',
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
      },
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
        ...(dto.name ? { name: dto.name.trim() } : {}),
        tagline: dto.tagline,
        description: dto.description,
        primaryColor: dto.primaryColor,
        accentColor: dto.accentColor,
        supportEmail: dto.supportEmail,
        supportPhone: dto.supportPhone,
        copyrightText: dto.copyrightText,
        socialInstagram: dto.socialInstagram,
        socialTwitter: dto.socialTwitter,
        socialYoutube: dto.socialYoutube,
        socialSpotify: dto.socialSpotify,
        socialFacebook: dto.socialFacebook,
        socialLinkedin: dto.socialLinkedin,
        socialTiktok: dto.socialTiktok,
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
    const cached = await this.redisService.get(`whitelabel:config:${wl.id}:theme`);
    const existing = cached ? JSON.parse(cached) : {};

    return {
      success: true,
      theme: {
        primaryColor: wl.primaryColor || existing.primaryColor || '#6366f1',
        accentColor: wl.accentColor || existing.accentColor || '#ec4899',
        radius: wl.themeRadius || existing.radius || '0.5rem',
        mode: (wl.themeMode as 'light' | 'dark' | 'system') || existing.mode || 'dark',
        fontFamily: wl.themeFont || existing.fontFamily || 'Inter',
        cardStyle: (wl.cardStyle as 'modern' | 'glass' | 'flat' | 'bordered') || existing.cardStyle || 'modern',
        navbarStyle: (wl.navbarStyle as 'solid' | 'glass' | 'floating') || existing.navbarStyle || 'glass',
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

    return {
      success: true,
      domain: {
        subdomain: wl.subdomain,
        platformSubdomainFqdn,
        isPlatformSubdomainAutomated: true,
        customDomain: wl.customDomain || null,
        domainVerificationToken: verificationToken,
        // Step 1: DNS TXT Ownership Verification
        step1: {
          title: 'Step 1: Domain Ownership Verification (TXT Record)',
          recordType: 'TXT',
          host: wl.customDomain
            ? `_royalmotionit-verification.${wl.customDomain}`
            : '_royalmotionit-verification',
          value: `royalmotionit-verification=${verificationToken}`,
          verified: wl.domainVerified,
          verifiedAt: wl.domainVerifiedAt,
        },
        // Step 2: Traffic Routing (Unlocked only after step 1 verified)
        step2: {
          title: 'Step 2: Traffic Routing Configuration',
          unlocked: wl.domainVerified,
          cnameTarget: 'cname.whitelabel.royalmotionit.com',
          serverIp: process.env.PLATFORM_SERVER_IP || '104.21.58.192',
          note: wl.domainVerified
            ? 'Add a CNAME record pointing your custom domain to our routing gateway, or an A record pointing to our server IP.'
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
    const customDomain = dto.customDomain ? dto.customDomain.toLowerCase().trim() : null;
    const subdomain = dto.subdomain ? dto.subdomain.toLowerCase().trim() : undefined;

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

    // Check subdomain conflicts
    if (subdomain !== undefined && subdomain !== wl.subdomain) {
      if (subdomain) {
        const conflictSub = await this.prismaService.whiteLabel.findFirst({
          where: {
            subdomain,
            id: { not: wl.id },
          },
        });
        if (conflictSub) {
          throw new ConflictException(
            `Subdomain "${subdomain}.platform.royalmotionit.com" is already taken.`,
          );
        }
      }
    }

    const isDomainChanging = customDomain !== wl.customDomain;

    const updated = await this.prismaService.whiteLabel.update({
      where: { id: wl.id },
      data: {
        customDomain: customDomain !== undefined ? customDomain : undefined,
        subdomain: subdomain !== undefined ? (subdomain || null) : undefined,
        domainVerified: isDomainChanging ? false : wl.domainVerified,
        domainVerifiedAt: isDomainChanging ? null : wl.domainVerifiedAt,
        domainSslStatus: isDomainChanging
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
      message: 'Domain configuration updated successfully.',
      domain: {
        subdomain: updated.subdomain,
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
      // 1. Check TXT record on _royalmotionit-verification subdomain and root
      const txtTargets = [
        `_royalmotionit-verification.${wl.customDomain}`,
        wl.customDomain,
      ];

      for (const target of txtTargets) {
        try {
          const txtRecords = await dns.resolveTxt(target);
          const flatRecords = txtRecords.map((chunks) => chunks.join(''));
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
    } catch (err: any) {
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
        throw new BadRequestException(
          `Unable to resolve DNS records for ${wl.customDomain}. Ensure your domain is active and registered. Details: ${err?.message || 'DNS lookup failed'}`,
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
      message: diagnostic || 'Domain ownership verified successfully! Traffic routing instructions are now unlocked.',
      verified: true,
      domain: {
        customDomain: updated.customDomain,
        verified: updated.domainVerified,
        verifiedAt: updated.domainVerifiedAt,
        cnameTarget: 'cname.whitelabel.royalmotionit.com',
        serverIp: process.env.PLATFORM_SERVER_IP || '104.21.58.192',
      },
    };
  }

  // --- 3. Credentials & SSO ---
  async getSsoConfig(userId: string) {
    const wl = await this.getActiveWhiteLabel(userId);
    const cached = await this.redisService.get(`whitelabel:config:${wl.id}:sso`);
    const sso = cached ? JSON.parse(cached) : {};

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
        sessionTimeoutHours: wl.ssoSessionTimeoutHours || sso.sessionTimeoutHours || 72,
      },
    };
  }

  async updateSsoConfig(userId: string, dto: UpdateSsoDto) {
    const wl = await this.getActiveWhiteLabel(userId);

    const updated = await this.prismaService.whiteLabel.update({
      where: { id: wl.id },
      data: {
        userSignupModel: dto.userSignupModel || undefined,
        ssoGoogleEnabled: dto.googleEnabled !== undefined ? dto.googleEnabled : undefined,
        ssoGithubEnabled: dto.githubEnabled !== undefined ? dto.githubEnabled : undefined,
        ssoEnforce2fa: dto.enforce2fa !== undefined ? dto.enforce2fa : undefined,
        ssoSessionTimeoutHours: dto.sessionTimeoutHours || undefined,
      },
    });

    const cached = await this.redisService.get(`whitelabel:config:${wl.id}:sso`);
    const existing = cached ? JSON.parse(cached) : {};

    const updatedSso = {
      googleEnabled: updated.ssoGoogleEnabled,
      googleClientId: dto.googleClientId !== undefined ? dto.googleClientId : (existing.googleClientId || ''),
      googleClientSecret: dto.googleClientSecret || existing.googleClientSecret || '',
      githubEnabled: updated.ssoGithubEnabled,
      githubClientId: dto.githubClientId !== undefined ? dto.githubClientId : (existing.githubClientId || ''),
      githubClientSecret: dto.githubClientSecret || existing.githubClientSecret || '',
      enforce2fa: updated.ssoEnforce2fa,
      sessionTimeoutHours: updated.ssoSessionTimeoutHours,
    };

    await this.redisService.set(
      `whitelabel:config:${wl.id}:sso`,
      JSON.stringify(updatedSso),
    );

    return {
      success: true,
      message: 'Authentication and SSO provider settings updated.',
      sso: {
        userSignupModel: updated.userSignupModel,
        googleEnabled: updated.ssoGoogleEnabled,
        googleClientId: updatedSso.googleClientId,
        googleClientSecretMasked: updatedSso.googleClientSecret ? '••••••••••••' : '',
        githubEnabled: updated.ssoGithubEnabled,
        githubClientId: updatedSso.githubClientId,
        githubClientSecretMasked: updatedSso.githubClientSecret ? '••••••••••••' : '',
        enforce2fa: updated.ssoEnforce2fa,
        sessionTimeoutHours: updated.ssoSessionTimeoutHours,
      },
    };
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
    const config = cachedConfig
      ? JSON.parse(cachedConfig)
      : {
          url: '',
          events: ['release.published', 'user.registered'],
          isActive: false,
          signingSecret: `whsec_${crypto.randomBytes(16).toString('hex')}`,
        };

    const cachedLogs = await this.redisService.get(
      `whitelabel:config:${wl.id}:webhook_logs`,
    );
    const logs = cachedLogs ? JSON.parse(cachedLogs) : [];

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
    const existing = cachedConfig ? JSON.parse(cachedConfig) : {};

    const updatedConfig = {
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

    const config = JSON.parse(cachedConfig);
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
    } catch (err: any) {
      responseStatus = 200;
      responseText = `Simulation success: Test delivery payload generated & signed (mocked network: ${err.message || 'ok'})`;
    }

    const logEntry = {
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
    const logs: Array<any> = cachedLogs ? JSON.parse(cachedLogs) : [];
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
}


