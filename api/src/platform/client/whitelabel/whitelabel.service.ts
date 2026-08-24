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
import { StorageService } from 'src/lib/storage/storage.service';
import { CreateWhiteLabelDto } from 'src/whitelabel/dto/create-whitelabel.dto';
import {
  Prisma,
  WhiteLabelStatus,
} from 'src/generated/prisma/client';

@Injectable()
export class ClientWhitelabelService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
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

    const fileUrl = this.storageService.getFileUrl(fileKey);
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

    const docsWithUrls = documents.map((doc) => ({
      ...doc,
      fileUrl: this.storageService.getFileUrl(doc.fileKey),
    }));

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

  async updateBranding(userId: string, dto: any) {
    const subscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: userId },
        include: { whiteLabel: true },
      });

    if (!subscription?.whiteLabel) {
      throw new NotFoundException('WhiteLabel not found for this account.');
    }

    const wlId = subscription.whiteLabel.id;

    // Validate subdomain uniqueness if changed
    if (dto.subdomain && dto.subdomain !== subscription.whiteLabel.subdomain) {
      const existing = await this.prismaService.whiteLabel.findFirst({
        where: {
          subdomain: dto.subdomain.toLowerCase().trim(),
          id: { not: wlId },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Subdomain "${dto.subdomain}" is already claimed by another label.`,
        );
      }
    }

    // Validate customDomain uniqueness if changed
    if (
      dto.customDomain &&
      dto.customDomain !== subscription.whiteLabel.customDomain
    ) {
      const existing = await this.prismaService.whiteLabel.findFirst({
        where: {
          customDomain: dto.customDomain.toLowerCase().trim(),
          id: { not: wlId },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Custom domain "${dto.customDomain}" is already connected to another label.`,
        );
      }
    }

    const updated = await this.prismaService.whiteLabel.update({
      where: { id: wlId },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        subdomain: dto.subdomain
          ? dto.subdomain.toLowerCase().trim()
          : undefined,
        customDomain: dto.customDomain
          ? dto.customDomain.toLowerCase().trim()
          : undefined,
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
}
