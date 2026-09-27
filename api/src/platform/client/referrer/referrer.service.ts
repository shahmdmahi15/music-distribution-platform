import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { generateUniqueCode, CodePrefix } from 'src/lib/prisma/code-generator';
import { StorageService } from 'src/lib/storage/storage.service';
import { IMMUTABLE_CACHE_CONTROL } from 'src/config/storage-keys.config';
import { ReferrerStatus } from 'src/generated/prisma/client';
import { CreateReferrerApplicationDto } from './dto/create-referrer-application.dto';

@Injectable()
export class ClientReferrerService {
  private readonly logger = new Logger(ClientReferrerService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private generateSlugReferralCode(name: string): string {
    const clean = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${clean || 'REF'}-${random}`;
  }

  async apply(userId: string, dto: CreateReferrerApplicationDto) {
    const existing = await this.prismaService.referrer.findUnique({
      where: { userId },
    });

    if (existing && existing.status === ReferrerStatus.ACTIVE) {
      throw new ConflictException(
        'You already have an active Partner Referrer account.',
      );
    }

    let referralCode = dto.referralCode?.trim().toUpperCase();
    if (!referralCode) {
      referralCode = this.generateSlugReferralCode(dto.name);
    }

    // Ensure referralCode is globally unique
    const codeConflict = await this.prismaService.referrer.findFirst({
      where: {
        referralCode,
        ...(existing ? { NOT: { id: existing.id } } : {}),
      },
    });

    if (codeConflict) {
      referralCode = `${referralCode}-${Math.floor(100 + Math.random() * 900)}`;
    }

    if (existing) {
      // Update existing application and reset status to PENDING
      const updated = await this.prismaService.referrer.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          referralCode,
          companyWebsite: dto.companyWebsite || null,
          country: dto.country || null,
          yearsInBusiness: dto.yearsInBusiness || 0,
          isIncorporated: dto.isIncorporated || false,
          incorporationDocUrl: dto.incorporationDocUrl || null,
          contactFirstName: dto.contactFirstName,
          contactLastName: dto.contactLastName,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone || null,
          contactWhatsApp: dto.contactWhatsApp || null,
          contactLinkedIn: dto.contactLinkedIn || null,
          payoutMethod: dto.payoutMethod,
          bankName: dto.bankName || null,
          accountName: dto.accountName || null,
          accountNumber: dto.accountNumber || null,
          branchDistrict: dto.branchDistrict || null,
          branchName: dto.branchName || null,
          routingNumber: dto.routingNumber || null,
          swiftCode: dto.swiftCode || null,
          walletNumber: dto.walletNumber || null,
          onboardingDetails: dto.onboardingDetails as any,
          status: ReferrerStatus.PENDING,
          statusReason: null,
        },
      });

      return {
        success: true,
        message: 'Referrer application submitted successfully and is pending review.',
        referrer: updated,
      };
    }

    const code = await generateUniqueCode(
      this.prismaService,
      'referrer',
      CodePrefix.REFERRER,
    );

    const created = await this.prismaService.referrer.create({
      data: {
        code,
        referralCode,
        name: dto.name,
        companyWebsite: dto.companyWebsite || null,
        country: dto.country || null,
        yearsInBusiness: dto.yearsInBusiness || 0,
        isIncorporated: dto.isIncorporated || false,
        incorporationDocUrl: dto.incorporationDocUrl || null,
        contactFirstName: dto.contactFirstName,
        contactLastName: dto.contactLastName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone || null,
        contactWhatsApp: dto.contactWhatsApp || null,
        contactLinkedIn: dto.contactLinkedIn || null,
        payoutMethod: dto.payoutMethod,
        bankName: dto.bankName || null,
        accountName: dto.accountName || null,
        accountNumber: dto.accountNumber || null,
        branchDistrict: dto.branchDistrict || null,
        branchName: dto.branchName || null,
        routingNumber: dto.routingNumber || null,
        swiftCode: dto.swiftCode || null,
        walletNumber: dto.walletNumber || null,
        onboardingDetails: dto.onboardingDetails as any,
        status: ReferrerStatus.PENDING,
        userId,
      },
    });

    return {
      success: true,
      message: 'Referrer partner application created successfully.',
      referrer: created,
    };
  }

  async getStatus(userId: string) {
    const referrer = await this.prismaService.referrer.findUnique({
      where: { userId },
      include: {
        deals: {
          orderBy: { createdAt: 'desc' },
        },
        referredUsers: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
            subscription: {
              select: {
                id: true,
                code: true,
                whiteLabel: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!referrer) {
      return {
        hasApplied: false,
        status: null,
        referrer: null,
      };
    }

    let contractUrl: string | null = null;
    if (referrer.contractKey) {
      try {
        contractUrl = await this.storageService.getPresignedUrl(
          referrer.contractKey,
          3600 * 24,
        );
      } catch (e) {
        this.logger.warn(`Failed to presign contract for referrer ${referrer.id}: ${e}`);
      }
    }

    return {
      hasApplied: true,
      status: referrer.status,
      code: referrer.code,
      referralCode: referrer.referralCode,
      name: referrer.name,
      approvedAt: referrer.approvedAt,
      reviewedAt: referrer.reviewedAt,
      statusReason: referrer.statusReason,
      contractUrl,
      payoutMethod: referrer.payoutMethod,
      commissionRate: referrer.commissionRate,
      dealBenchmarkBdt: referrer.dealBenchmarkBdt,
      minGuaranteedBountyBdt: referrer.minGuaranteedBountyBdt,
      operatingHub: referrer.operatingHub,
      referrer,
    };
  }

  async getMe(userId: string) {
    const referrer = await this.prismaService.referrer.findUnique({
      where: { userId },
      include: {
        deals: {
          orderBy: { createdAt: 'desc' },
        },
        referredUsers: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
            subscription: {
              select: {
                id: true,
                code: true,
                whiteLabel: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!referrer) {
      throw new NotFoundException('Referrer account not found.');
    }

    let contractUrl: string | null = null;
    if (referrer.contractKey) {
      try {
        contractUrl = await this.storageService.getPresignedUrl(
          referrer.contractKey,
          3600 * 24,
        );
      } catch (e) {
        this.logger.warn(`Failed to presign contract for referrer ${referrer.id}: ${e}`);
      }
    }

    const docsWithUrls = await Promise.all(
      referrer.documents.map(async (doc) => ({
        ...doc,
        fileUrl: doc.fileKey
          ? await this.storageService.getPresignedUrl(doc.fileKey, 3600 * 24).catch(() => null)
          : null,
      })),
    );

    return {
      success: true,
      referrer: {
        ...referrer,
        contractUrl,
        documents: docsWithUrls,
      },
    };
  }

  async createDeal(userId: string, dto: {
    clientName: string;
    clientEmail?: string;
    contactName?: string;
    contactPhone?: string;
    sellingPriceBdt?: number;
    notes?: string;
  }) {
    const referrer = await this.prismaService.referrer.findUnique({
      where: { userId },
    });

    if (!referrer) {
      throw new NotFoundException('Referrer account not found.');
    }

    if (referrer.status !== ReferrerStatus.ACTIVE) {
      throw new BadRequestException('Only active referrer partners can log pipeline deals.');
    }

    const sellingPrice = dto.sellingPriceBdt || referrer.dealBenchmarkBdt || 60000;
    const rate = referrer.commissionRate || 15.0;
    const bounty = Math.round(sellingPrice * (rate / 100));

    const code = await generateUniqueCode(
      this.prismaService,
      'referrerDeal',
      CodePrefix.REFERRER_DEAL,
    );

    const deal = await this.prismaService.referrerDeal.create({
      data: {
        code,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail || null,
        sellingPriceBdt: sellingPrice,
        referrerBountyBdt: bounty,
        status: 'PENDING',
        referrerId: referrer.id,
      },
    });

    return {
      success: true,
      message: `Prospect deal "${dto.clientName}" registered successfully with anticipated bounty of ৳${bounty.toLocaleString()} BDT.`,
      deal,
    };
  }

  async getContractPreview(userId: string) {
    const referrer = await this.prismaService.referrer.findUnique({
      where: { userId },
      select: {
        id: true,
        contractKey: true,
        contractFileName: true,
        contractFileSize: true,
        contractUploadedAt: true,
      },
    });

    if (!referrer || !referrer.contractKey) {
      throw new NotFoundException('No contract document found.');
    }

    const previewUrl = await this.storageService.getPresignedUrl(
      referrer.contractKey,
      3600,
    );

    return {
      success: true,
      previewUrl,
      fileName: referrer.contractFileName || 'contract.pdf',
      fileSize: referrer.contractFileSize,
      uploadedAt: referrer.contractUploadedAt,
    };
  }

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    docType: string,
    name?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    const referrer = await this.prismaService.referrer.findUnique({
      where: { userId },
    });

    if (!referrer) {
      throw new NotFoundException('Referrer account not found.');
    }

    const docCode = await generateUniqueCode(
      this.prismaService,
      'referrerDocument',
      CodePrefix.REFERRER_DOCUMENT,
    );

    const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey = `referrer/${referrer.code}/documents/${docCode}_${cleanFilename}`;

    await this.storageService.uploadFileBuffer(
      fileKey,
      file.buffer,
      file.mimetype,
      { cacheControl: IMMUTABLE_CACHE_CONTROL },
    );

    const document = await this.prismaService.referrerDocument.create({
      data: {
        code: docCode,
        name: name || file.originalname,
        fileName: file.originalname,
        fileKey,
        fileSize: file.size,
        mimeType: file.mimetype,
        docType: docType || 'OTHER',
        referrerId: referrer.id,
      },
    });

    const fileUrl = await this.storageService.getPresignedUrl(fileKey, 3600 * 24);

    return {
      success: true,
      message: `Document "${file.originalname}" uploaded successfully.`,
      document: {
        ...document,
        fileUrl,
      },
    };
  }
}
