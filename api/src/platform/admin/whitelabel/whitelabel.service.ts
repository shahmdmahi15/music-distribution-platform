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
  AdminWhiteLabelQueryDto,
  SortOrder,
} from './dto/admin-whitelabel-query.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { UpdateWhiteLabelStatusDto } from './dto/update-status.dto';
import {
  DOCUMENT_URL_TTL_SECONDS,
  StorageService,
} from 'src/lib/storage/storage.service';
import { IMMUTABLE_CACHE_CONTROL } from 'src/config/storage-keys.config';
import { CloudflareDnsService } from 'src/lib/cloudflare/cloudflare-dns.service';
import { AdminUpdateBrandingDto } from './dto/admin-update-branding.dto';
import {
  PaymentStatus,
  Prisma,
  WhiteLabelStatus,
} from 'src/generated/prisma/client';

@Injectable()
export class AdminWhitelabelService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
    private readonly cloudflareDnsService: CloudflareDnsService,
  ) {}

  async getWhiteLabels(query: AdminWhiteLabelQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.WhiteLabelWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.businessType) {
      where.businessType = query.businessType;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { contactFirstName: { contains: term, mode: 'insensitive' } },
        { contactLastName: { contains: term, mode: 'insensitive' } },
        { contactEmail: { contains: term, mode: 'insensitive' } },
        { companyWebsite: { contains: term, mode: 'insensitive' } },
        { country: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [field = 'createdAt', order = 'desc'] = (
      query.sortBy || 'createdAt:desc'
    ).split(':');

    const orderBy: Prisma.WhiteLabelOrderByWithRelationInput = {
      [field]: order === SortOrder.ASC ? Prisma.SortOrder.asc : Prisma.SortOrder.desc,
    };

    const [items, total, statusGroups] = await Promise.all([
      this.prismaService.whiteLabel.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          subscription: {
            include: {
              subscriber: {
                select: {
                  id: true,
                  code: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
              payments: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
          artists: {
            orderBy: { orderIndex: 'asc' },
          },
          documents: true,
        },
      }),
      this.prismaService.whiteLabel.count({ where }),
      this.prismaService.whiteLabel.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const statusCount = (status: WhiteLabelStatus) =>
      statusGroups.find((group) => group.status === status)?._count._all ?? 0;

    return {
      success: true,
      message: 'WhiteLabels fetched successfully.',
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        all: total,
        pending: statusCount(WhiteLabelStatus.PENDING),
        underReview: statusCount(WhiteLabelStatus.UNDER_REVIEW),
        approved: statusCount(WhiteLabelStatus.APPROVED),
        rejected: statusCount(WhiteLabelStatus.REJECTED),
      },
    };
  }

  async getWhiteLabelById(id: string) {
    const whiteLabel = await this.prismaService.whiteLabel.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            subscriber: {
              select: {
                id: true,
                code: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                createdAt: true,
                lastLoginAt: true,
              },
            },
            payments: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
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
        },
      },
    });

    if (!whiteLabel) {
      throw new NotFoundException('WhiteLabel not found.');
    }

    return {
      success: true,
      message: 'WhiteLabel details fetched successfully.',
      whiteLabel,
    };
  }

  // Strict state transition graph:
  // PENDING -> UNDER_REVIEW -> REJECTED or PROCESSING -> CONTRACTED -> PAID -> ACTIVE -> SUSPENDED
  private static readonly VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['UNDER_REVIEW', 'REJECTED'],
    UNDER_REVIEW: ['PROCESSING', 'REJECTED'],
    PROCESSING: ['CONTRACTED', 'REJECTED'],
    CONTRACTED: ['PAID', 'REJECTED'],
    PAID: ['ACTIVE', 'APPROVED'],
    APPROVED: ['ACTIVE', 'SUSPENDED'],
    ACTIVE: ['SUSPENDED'],
    SUSPENDED: ['ACTIVE'],
    REJECTED: ['PENDING'],
  };

  async updateStatus(
    id: string,
    dto: UpdateWhiteLabelStatusDto,
  ) {
    const existing = await this.prismaService.whiteLabel.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            payments: {
              where: { status: PaymentStatus.COMPLETED },
              take: 1,
            },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('WhiteLabel not found.');
    }

    const currentStatus = existing.status as string;
    const targetStatus = dto.status as string;

    const allowed = AdminWhitelabelService.VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid status transition from "${currentStatus}" to "${targetStatus}". The lifecycle must strictly follow: PENDING -> UNDER_REVIEW -> PROCESSING / REJECTED -> CONTRACTED -> PAID -> ACTIVE -> SUSPENDED.`,
      );
    }

    // Guard: Advancing to CONTRACTED requires a signed contract PDF
    if (targetStatus === 'CONTRACTED' && !existing.contractKey) {
      throw new BadRequestException(
        'Cannot advance to CONTRACTED before uploading a signed contract agreement PDF.',
      );
    }

    // Guard: Advancing to PAID requires at least one completed payment record
    if (targetStatus === 'PAID') {
      const hasPayment =
        existing.subscription?.payments && existing.subscription.payments.length > 0;
      if (!hasPayment) {
        throw new BadRequestException(
          'Cannot advance to PAID before a payment record is registered in the system.',
        );
      }
    }

    // Guard: Advancing to ACTIVE provisions Cloudflare DNS
    let cloudflareMessage = '';
    if (targetStatus === 'ACTIVE' || targetStatus === 'APPROVED') {
      const hasPayment =
        existing.subscription?.payments && existing.subscription.payments.length > 0;
      if (!hasPayment) {
        throw new BadRequestException(
          'Cannot activate WhiteLabel before payment is recorded and verified.',
        );
      }

      if (existing.subdomain) {
        const dnsResult = await this.cloudflareDnsService.provisionSubdomain(existing.subdomain);
        cloudflareMessage = ` (${dnsResult.message})`;
      }
    }

    const updated = await this.prismaService.whiteLabel.update({
      where: { id },
      data: {
        status: dto.status,
        statusReason: dto.statusReason || null,
        reviewedAt: new Date(),
        ...((dto.status === WhiteLabelStatus.ACTIVE || dto.status === WhiteLabelStatus.APPROVED) && {
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
      message: `WhiteLabel status transitioned to ${dto.status}.${cloudflareMessage}`,
      whiteLabel: updated,
    };
  }

  async uploadContract(
    id: string,
    file: Express.Multer.File,
    adminEmail?: string,
  ) {
    const whiteLabel = await this.prismaService.whiteLabel.findUnique({
      where: { id },
    });

    if (!whiteLabel) {
      throw new NotFoundException('WhiteLabel not found.');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Contract file must be a valid PDF document.');
    }

    const currentStatus = whiteLabel.status as string;
    if (
      currentStatus !== WhiteLabelStatus.PROCESSING &&
      currentStatus !== WhiteLabelStatus.CONTRACTED
    ) {
      throw new BadRequestException(
        `Cannot upload contract in current state "${currentStatus}". WhiteLabel must be in PROCESSING or CONTRACTED state.`,
      );
    }

    const fileKey = `whitelabel/${whiteLabel.code}/contracts/contract_${Date.now()}.pdf`;
    await this.storageService.uploadFileBuffer(
      fileKey,
      file.buffer,
      file.mimetype,
      { cacheControl: IMMUTABLE_CACHE_CONTROL },
    );

    // Save contract metadata and advance status to CONTRACTED
    const updated = await this.prismaService.whiteLabel.update({
      where: { id },
      data: {
        contractKey: fileKey,
        contractFileName: file.originalname,
        contractFileSize: file.size,
        contractUploadedAt: new Date(),
        contractUploadedBy: adminEmail || 'Administrator',
        status: WhiteLabelStatus.CONTRACTED,
        reviewedAt: new Date(),
      },
    });

    const previewUrl = await this.storageService.getPresignedUrl(fileKey, 3600);

    return {
      success: true,
      message: `Signed contract "${file.originalname}" uploaded successfully. WhiteLabel status transitioned to CONTRACTED.`,
      contractUrl: previewUrl,
      whiteLabel: updated,
    };
  }

  async getContractPreview(id: string) {
    const whiteLabel = await this.prismaService.whiteLabel.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        contractKey: true,
        contractFileName: true,
        contractFileSize: true,
        contractUploadedAt: true,
        contractUploadedBy: true,
      },
    });

    if (!whiteLabel) {
      throw new NotFoundException('WhiteLabel not found.');
    }

    if (!whiteLabel.contractKey) {
      throw new NotFoundException('No signed contract agreement has been uploaded for this WhiteLabel.');
    }

    const contractUrl = await this.storageService.getPresignedUrl(
      whiteLabel.contractKey,
      3600,
    );

    return {
      success: true,
      contractUrl,
      fileName: whiteLabel.contractFileName || 'contract.pdf',
      fileSize: whiteLabel.contractFileSize,
      uploadedAt: whiteLabel.contractUploadedAt,
      uploadedBy: whiteLabel.contractUploadedBy,
    };
  }

  async recordPayment(id: string, dto: RecordPaymentDto) {
    const whiteLabel = await this.prismaService.whiteLabel.findUnique({
      where: { id },
      include: { subscription: true },
    });

    if (!whiteLabel) {
      throw new NotFoundException('WhiteLabel not found.');
    }

    const currentStatus = whiteLabel.status as string;
    if (
      currentStatus !== WhiteLabelStatus.CONTRACTED &&
      currentStatus !== WhiteLabelStatus.PAID &&
      currentStatus !== WhiteLabelStatus.PROCESSING
    ) {
      throw new BadRequestException(
        `Cannot record payment in current state "${currentStatus}". WhiteLabel must be in CONTRACTED state first.`,
      );
    }

    const paymentCode = await generateUniqueCode(
      this.prismaService,
      'platformSubscriptionPayment',
      CodePrefix.PLATFORM_PAYMENT,
    );

    const payment = await this.prismaService.platformSubscriptionPayment.create({
      data: {
        code: paymentCode,
        amount: dto.amount,
        discount: dto.discount ?? 0,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        status: dto.status || PaymentStatus.COMPLETED,
        paymentMethod: dto.paymentMethod || 'HAND_TO_HAND',
        receiptReference: dto.receiptReference || null,
        adminNotes: dto.adminNotes || null,
        subscriptionId: whiteLabel.subscriptionId,
      },
    });

    // Advance WhiteLabel status to PAID
    const updated = await this.prismaService.whiteLabel.update({
      where: { id },
      data: {
        status: WhiteLabelStatus.PAID,
        reviewedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Payment recorded successfully. WhiteLabel status transitioned to PAID.',
      payment,
      whiteLabel: updated,
    };
  }

  async activateWhiteLabel(id: string) {
    const whiteLabel = await this.prismaService.whiteLabel.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            payments: {
              where: { status: PaymentStatus.COMPLETED },
              orderBy: { endsAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!whiteLabel) {
      throw new NotFoundException('WhiteLabel not found.');
    }

    const currentStatus = whiteLabel.status as string;
    if (
      currentStatus !== WhiteLabelStatus.PAID &&
      currentStatus !== WhiteLabelStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Cannot activate WhiteLabel in current state "${currentStatus}". WhiteLabel must be in PAID state with verified payment before activation.`,
      );
    }

    if (!whiteLabel.subscription.payments || whiteLabel.subscription.payments.length === 0) {
      throw new BadRequestException(
        'Cannot activate WhiteLabel without a recorded payment. Please record payment first.',
      );
    }

    // Automate Cloudflare DNS provisioning for platform subdomain
    let cloudflareMessage = '';
    if (whiteLabel.subdomain) {
      const dnsRes = await this.cloudflareDnsService.provisionSubdomain(whiteLabel.subdomain);
      cloudflareMessage = ` (${dnsRes.message})`;
    }

    const updated = await this.prismaService.whiteLabel.update({
      where: { id },
      data: {
        status: WhiteLabelStatus.ACTIVE,
        statusReason: 'Activated by administrator.',
        approvedAt: new Date(),
        reviewedAt: new Date(),
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
      message: `WhiteLabel ${updated.name} activated successfully!${cloudflareMessage} Full console menus and portal access unlocked.`,
      whiteLabel: updated,
    };
  }

  async suspendWhiteLabel(id: string, reason?: string) {
    const whiteLabel = await this.prismaService.whiteLabel.findUnique({
      where: { id },
    });

    if (!whiteLabel) {
      throw new NotFoundException('WhiteLabel not found.');
    }

    const updated = await this.prismaService.whiteLabel.update({
      where: { id },
      data: {
        status: WhiteLabelStatus.SUSPENDED,
        statusReason: reason || 'Suspended by administrator.',
      },
    });

    return {
      success: true,
      message: `WhiteLabel ${updated.name} has been suspended.`,
      whiteLabel: updated,
    };
  }

  async unsuspendWhiteLabel(id: string) {
    const whiteLabel = await this.prismaService.whiteLabel.findUnique({
      where: { id },
    });

    if (!whiteLabel) {
      throw new NotFoundException('WhiteLabel not found.');
    }

    const updated = await this.prismaService.whiteLabel.update({
      where: { id },
      data: {
        status: WhiteLabelStatus.ACTIVE,
        statusReason: 'Reactivated / Unsuspended by administrator.',
      },
    });

    return {
      success: true,
      message: `WhiteLabel ${updated.name} has been unsuspended and restored to active status.`,
      whiteLabel: updated,
    };
  }

  async uploadDocument(
    whiteLabelId: string,
    file: Express.Multer.File,
    documentType: string,
    title?: string,
    adminUserId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for upload.');
    }

    const whiteLabel = await this.prismaService.whiteLabel.findUnique({
      where: { id: whiteLabelId },
    });

    if (!whiteLabel) {
      throw new NotFoundException('WhiteLabel not found.');
    }

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
      message: 'Document uploaded successfully.',
      document: {
        ...document,
        fileUrl,
      },
    };
  }

  async getDocuments(whiteLabelId: string) {
    const documents = await this.prismaService.whiteLabelDocument.findMany({
      where: { whiteLabelId },
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

  async deleteDocument(documentId: string) {
    const doc = await this.prismaService.whiteLabelDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new NotFoundException('Document not found.');
    }

    if (doc.fileKey) {
      try {
        await this.storageService.deleteFile(doc.fileKey);
      } catch (err) {
        console.error('Failed to delete S3 file:', err);
      }
    }

    await this.prismaService.whiteLabelDocument.delete({
      where: { id: documentId },
    });

    return {
      success: true,
      message: 'Document deleted successfully.',
    };
  }

  async deletePayment(paymentId: string) {
    const payment =
      await this.prismaService.platformSubscriptionPayment.findUnique({
        where: { id: paymentId },
      });

    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }

    await this.prismaService.platformSubscriptionPayment.delete({
      where: { id: paymentId },
    });

    return {
      success: true,
      message: 'Payment record deleted successfully.',
    };
  }

  async getBranding(whiteLabelId: string) {
    const wl = await this.prismaService.whiteLabel.findUnique({
      where: { id: whiteLabelId },
    });

    if (!wl) {
      throw new NotFoundException('WhiteLabel not found.');
    }

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

  async updateBranding(whiteLabelId: string, dto: AdminUpdateBrandingDto) {
    const wl = await this.prismaService.whiteLabel.findUnique({
      where: { id: whiteLabelId },
    });

    if (!wl) {
      throw new NotFoundException('WhiteLabel not found.');
    }

    if (dto.subdomain && dto.subdomain !== wl.subdomain) {
      const existing = await this.prismaService.whiteLabel.findFirst({
        where: {
          subdomain: dto.subdomain.toLowerCase().trim(),
          id: { not: whiteLabelId },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Subdomain "${dto.subdomain}" is already claimed.`,
        );
      }
    }

    if (dto.customDomain && dto.customDomain !== wl.customDomain) {
      const existing = await this.prismaService.whiteLabel.findFirst({
        where: {
          customDomain: dto.customDomain.toLowerCase().trim(),
          id: { not: whiteLabelId },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Custom domain "${dto.customDomain}" is already in use.`,
        );
      }
    }

    const updated = await this.prismaService.whiteLabel.update({
      where: { id: whiteLabelId },
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
      message: 'Branding updated successfully.',
      branding: updated,
    };
  }

  async uploadBrandingAsset(
    whiteLabelId: string,
    file: Express.Multer.File,
    assetType: 'logo' | 'logoDark' | 'favicon' | 'banner',
  ) {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    const wl = await this.prismaService.whiteLabel.findUnique({
      where: { id: whiteLabelId },
    });

    if (!wl) {
      throw new NotFoundException('WhiteLabel not found.');
    }

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
    whiteLabelId: string,
    assetType: 'logo' | 'logoDark' | 'favicon' | 'banner',
  ) {
    const wl = await this.prismaService.whiteLabel.findUnique({
      where: { id: whiteLabelId },
    });

    if (!wl) {
      throw new NotFoundException('WhiteLabel not found.');
    }

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
