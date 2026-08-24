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
import { CreateWhiteLabelDto } from './dto/create-whitelabel.dto';
import { UpdateWhiteLabelDto } from './dto/update-whitelabel.dto';
import { Prisma, WhiteLabelStatus } from 'src/generated/prisma/client';

@Injectable()
export class WhitelabelService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(subscriptionId: string, dto: CreateWhiteLabelDto) {
    // Check if subscription exists and does not already have a WhiteLabel
    const existingSubscription =
      await this.prismaService.platformSubscription.findUnique({
        where: { id: subscriptionId },
        include: { whiteLabel: { select: { id: true } } },
      });

    if (!existingSubscription) {
      throw new NotFoundException('Platform subscription not found.');
    }

    if (existingSubscription.whiteLabel) {
      throw new ConflictException(
        'This subscription already has an associated WhiteLabel profile.',
      );
    }

    const whiteLabelCode = await generateUniqueCode(
      this.prismaService,
      'whiteLabel',
      CodePrefix.WHITELABEL,
    );

    // Prepare artists with generated sequential codes
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
        subscriptionId: subscriptionId,
        artists: {
          create: artistData,
        },
      },
      include: {
        artists: {
          orderBy: { orderIndex: 'asc' },
        },
        documents: true,
      },
    });

    return {
      success: true,
      message: `WhiteLabel ${whiteLabel.name} created successfully.`,
      whiteLabel,
    };
  }

  async findById(id: string) {
    const whiteLabel = await this.prismaService.whiteLabel.findUnique({
      where: { id },
      include: {
        artists: {
          orderBy: { orderIndex: 'asc' },
        },
        documents: true,
        partners: {
          include: {
            user: {
              select: {
                id: true,
                code: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
          },
          take: 10,
        },
      },
    });

    if (!whiteLabel) {
      throw new NotFoundException('WhiteLabel not found.');
    }

    return {
      success: true,
      message: 'WhiteLabel fetched successfully.',
      whiteLabel,
    };
  }

  async update(id: string, dto: UpdateWhiteLabelDto) {
    const existing = await this.prismaService.whiteLabel.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('WhiteLabel not found.');
    }

    const updated = await this.prismaService.whiteLabel.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.businessType && { businessType: dto.businessType }),
        ...(dto.companyWebsite !== undefined && {
          companyWebsite: dto.companyWebsite,
        }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.yearsInBusiness !== undefined && {
          yearsInBusiness: dto.yearsInBusiness,
        }),
        ...(dto.isIncorporated !== undefined && {
          isIncorporated: dto.isIncorporated,
        }),
        ...(dto.incorporationDocUrl !== undefined && {
          incorporationDocUrl: dto.incorporationDocUrl,
        }),
        ...(dto.contactFirstName && {
          contactFirstName: dto.contactFirstName,
        }),
        ...(dto.contactLastName && {
          contactLastName: dto.contactLastName,
        }),
        ...(dto.contactEmail && { contactEmail: dto.contactEmail }),
        ...(dto.contactLinkedIn !== undefined && {
          contactLinkedIn: dto.contactLinkedIn,
        }),
        ...(dto.catalogTrackCount !== undefined && {
          catalogTrackCount: dto.catalogTrackCount,
        }),
        ...(dto.monthlyTrackDelivery !== undefined && {
          monthlyTrackDelivery: dto.monthlyTrackDelivery,
        }),
        ...(dto.monthlyRevenueUsd !== undefined && {
          monthlyRevenueUsd: dto.monthlyRevenueUsd,
        }),
        ...(dto.hasDirectDeals !== undefined && {
          hasDirectDeals: dto.hasDirectDeals,
        }),
        ...(dto.currentDistributors && {
          currentDistributors: dto.currentDistributors,
        }),
        ...(dto.royaltySolutions && {
          royaltySolutions: dto.royaltySolutions,
        }),
        ...(dto.primaryCatalogLanguage && {
          primaryCatalogLanguage: dto.primaryCatalogLanguage,
        }),
        ...(dto.wantsCatalogMigration !== undefined && {
          wantsCatalogMigration: dto.wantsCatalogMigration,
        }),
        ...(dto.hasSampleBasedCovers !== undefined && {
          hasSampleBasedCovers: dto.hasSampleBasedCovers,
        }),
        ...(dto.userSignupModel && {
          userSignupModel: dto.userSignupModel,
        }),
        ...(dto.status && { status: dto.status }),
        ...(dto.statusReason !== undefined && {
          statusReason: dto.statusReason,
        }),
        ...(dto.status === WhiteLabelStatus.APPROVED && {
          approvedAt: new Date(),
        }),
      },
      include: {
        artists: {
          orderBy: { orderIndex: 'asc' },
        },
        documents: true,
      },
    });

    return {
      success: true,
      message: 'WhiteLabel updated successfully.',
      whiteLabel: updated,
    };
  }
}
