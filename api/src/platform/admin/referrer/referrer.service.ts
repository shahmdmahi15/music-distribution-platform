import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { generateUniqueCode, CodePrefix } from 'src/lib/prisma/code-generator';
import { StorageService } from 'src/lib/storage/storage.service';
import { IMMUTABLE_CACHE_CONTROL } from 'src/config/storage-keys.config';
import { Prisma, ReferrerStatus } from 'src/generated/prisma/client';
import { AdminReferrerQueryDto, ReferrerSortBy, SortOrder } from './dto/admin-referrer-query.dto';
import { UpdateReferrerStatusDto } from './dto/update-referrer-status.dto';
import { UpdateReferrerDossierDto } from './dto/update-referrer-dossier.dto';
import { CreateReferrerDealDto } from './dto/create-referrer-deal.dto';

@Injectable()
export class AdminReferrerService {
  private readonly logger = new Logger(AdminReferrerService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getReferrers(query: AdminReferrerQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ReferrerWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.payoutMethod) {
      where.payoutMethod = query.payoutMethod;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { referralCode: { contains: term, mode: 'insensitive' } },
        { contactFirstName: { contains: term, mode: 'insensitive' } },
        { contactLastName: { contains: term, mode: 'insensitive' } },
        { contactEmail: { contains: term, mode: 'insensitive' } },
        { contactPhone: { contains: term, mode: 'insensitive' } },
        { bankName: { contains: term, mode: 'insensitive' } },
        { accountName: { contains: term, mode: 'insensitive' } },
        { accountNumber: { contains: term, mode: 'insensitive' } },
        { walletNumber: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [field = 'createdAt', order = 'desc'] = (
      query.sortBy || 'createdAt:desc'
    ).split(':');

    const orderBy: Prisma.ReferrerOrderByWithRelationInput = {
      [field]:
        order === SortOrder.ASC ? Prisma.SortOrder.asc : Prisma.SortOrder.desc,
    };

    const [items, total, statusGroups] = await Promise.all([
      this.prismaService.referrer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
          deals: {
            orderBy: { createdAt: 'desc' },
          },
          documents: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prismaService.referrer.count({ where }),
      this.prismaService.referrer.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const statusCount = (status: ReferrerStatus) =>
      statusGroups.find((g) => g.status === status)?._count._all ?? 0;

    const globalTotalCount = statusGroups.reduce(
      (acc, g) => acc + (g._count?._all ?? 0),
      0,
    );

    // Attach signed URLs to documents & contracts
    const itemsWithUrls = await Promise.all(
      items.map(async (ref) => {
        let contractUrl: string | null = null;
        if (ref.contractKey) {
          try {
            contractUrl = await this.storageService.getPresignedUrl(
              ref.contractKey,
              3600 * 24,
            );
          } catch (e) {
            this.logger.warn(`Failed to generate contract presigned URL for ${ref.id}: ${e}`);
          }
        }

        const docsWithUrls = await Promise.all(
          ref.documents.map(async (doc) => ({
            ...doc,
            fileUrl: doc.fileKey
              ? await this.storageService.getPresignedUrl(doc.fileKey, 3600 * 24).catch(() => null)
              : null,
          })),
        );

        return {
          ...ref,
          contractUrl,
          documents: docsWithUrls,
        };
      }),
    );

    return {
      items: itemsWithUrls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      counts: {
        total: globalTotalCount,
        pending: statusCount(ReferrerStatus.PENDING),
        underReview: statusCount(ReferrerStatus.UNDER_REVIEW),
        active: statusCount(ReferrerStatus.ACTIVE),
        suspended: statusCount(ReferrerStatus.SUSPENDED),
        rejected: statusCount(ReferrerStatus.REJECTED),
      },
    };
  }

  async getReferrerById(id: string) {
    const referrer = await this.prismaService.referrer.findUnique({
      where: { id },
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
        deals: {
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!referrer) {
      throw new NotFoundException('Referrer not found.');
    }

    let contractUrl: string | null = null;
    if (referrer.contractKey) {
      try {
        contractUrl = await this.storageService.getPresignedUrl(
          referrer.contractKey,
          3600 * 24,
        );
      } catch (e) {
        this.logger.warn(`Failed to presign contract for referrer ${id}: ${e}`);
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

  async updateStatus(id: string, dto: UpdateReferrerStatusDto) {
    const referrer = await this.prismaService.referrer.findUnique({
      where: { id },
    });

    if (!referrer) {
      throw new NotFoundException('Referrer not found.');
    }

    if (
      dto.status === ReferrerStatus.REJECTED &&
      (!dto.statusReason || !dto.statusReason.trim())
    ) {
      throw new BadRequestException(
        'A reason note is required when rejecting a partner application.',
      );
    }

    const data: Prisma.ReferrerUpdateInput = {
      status: dto.status,
      statusReason: dto.statusReason || null,
    };

    if (dto.status === ReferrerStatus.ACTIVE) {
      data.approvedAt = new Date();
    }
    if (dto.status === ReferrerStatus.UNDER_REVIEW) {
      data.reviewedAt = new Date();
    }

    const updated = await this.prismaService.referrer.update({
      where: { id },
      data,
    });

    return {
      success: true,
      message: `Referrer status updated to ${dto.status}.`,
      referrer: updated,
    };
  }

  async updateDossier(id: string, dto: UpdateReferrerDossierDto) {
    const referrer = await this.prismaService.referrer.findUnique({
      where: { id },
    });

    if (!referrer) {
      throw new NotFoundException('Referrer not found.');
    }

    const updated = await this.prismaService.referrer.update({
      where: { id },
      data: {
        name: dto.name,
        referralCode: dto.referralCode,
        companyWebsite: dto.companyWebsite,
        country: dto.country,
        yearsInBusiness: dto.yearsInBusiness,
        isIncorporated: dto.isIncorporated,
        incorporationDocUrl: dto.incorporationDocUrl,
        contactFirstName: dto.contactFirstName,
        contactLastName: dto.contactLastName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        contactLinkedIn: dto.contactLinkedIn,
        commissionRate: dto.commissionRate,
        dealBenchmarkBdt: dto.dealBenchmarkBdt,
        minGuaranteedBountyBdt: dto.minGuaranteedBountyBdt,
        operatingHub: dto.operatingHub,
        payoutMethod: dto.payoutMethod,
        bankName: dto.bankName,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        branchDistrict: dto.branchDistrict,
        branchName: dto.branchName,
        routingNumber: dto.routingNumber,
        swiftCode: dto.swiftCode,
        walletNumber: dto.walletNumber,
        adminNotes: dto.adminNotes,
      },
    });

    return {
      success: true,
      message: 'Referrer dossier updated successfully.',
      referrer: updated,
    };
  }

  async uploadContract(
    id: string,
    file: Express.Multer.File,
    adminEmail?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Contract file is required.');
    }

    const referrer = await this.prismaService.referrer.findUnique({
      where: { id },
    });

    if (!referrer) {
      throw new NotFoundException('Referrer not found.');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException(
        'Contract file must be a valid PDF document.',
      );
    }

    const fileKey = `referrer/${referrer.code}/contracts/contract_${Date.now()}.pdf`;
    await this.storageService.uploadFileBuffer(
      fileKey,
      file.buffer,
      file.mimetype,
      { cacheControl: IMMUTABLE_CACHE_CONTROL },
    );

    const updated = await this.prismaService.referrer.update({
      where: { id },
      data: {
        contractKey: fileKey,
        contractFileName: file.originalname,
        contractFileSize: file.size,
        contractUploadedAt: new Date(),
        contractUploadedBy: adminEmail || 'Administrator',
      },
    });

    const previewUrl = await this.storageService.getPresignedUrl(fileKey, 3600);

    return {
      success: true,
      message: `Signed partnership contract "${file.originalname}" uploaded successfully.`,
      contractUrl: previewUrl,
      referrer: updated,
    };
  }

  async getContractPreview(id: string) {
    const referrer = await this.prismaService.referrer.findUnique({
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

    if (!referrer) {
      throw new NotFoundException('Referrer not found.');
    }

    if (!referrer.contractKey) {
      throw new NotFoundException('No contract document uploaded for this referrer.');
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
      uploadedBy: referrer.contractUploadedBy,
    };
  }

  async uploadDocument(
    referrerId: string,
    file: Express.Multer.File,
    docType: string,
    name?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    const referrer = await this.prismaService.referrer.findUnique({
      where: { id: referrerId },
    });

    if (!referrer) {
      throw new NotFoundException('Referrer not found.');
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
        referrerId,
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

  async getDocumentPreview(docId: string) {
    const document = await this.prismaService.referrerDocument.findUnique({
      where: { id: docId },
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    const previewUrl = await this.storageService.getPresignedUrl(
      document.fileKey,
      3600,
    );

    return {
      success: true,
      previewUrl,
      fileName: document.fileName,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
    };
  }

  async deleteDocument(docId: string) {
    const document = await this.prismaService.referrerDocument.findUnique({
      where: { id: docId },
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    try {
      await this.storageService.deleteFile(document.fileKey);
    } catch (e) {
      this.logger.warn(`Failed to delete S3 file ${document.fileKey}: ${e}`);
    }

    await this.prismaService.referrerDocument.delete({
      where: { id: docId },
    });

    return {
      success: true,
      message: 'Document deleted successfully.',
    };
  }

  async createDeal(referrerId: string, dto: CreateReferrerDealDto) {
    const referrer = await this.prismaService.referrer.findUnique({
      where: { id: referrerId },
    });

    if (!referrer) {
      throw new NotFoundException('Referrer not found.');
    }

    const dealCode = await generateUniqueCode(
      this.prismaService,
      'referrerDeal',
      CodePrefix.REFERRER_DEAL,
    );

    // Calculate 15% bounty by default if not explicitly provided
    const calculatedBounty =
      dto.referrerBountyBdt !== undefined
        ? dto.referrerBountyBdt
        : Math.round(dto.sellingPriceBdt * (referrer.commissionRate / 100));

    const deal = await this.prismaService.referrerDeal.create({
      data: {
        code: dealCode,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        sellingPriceBdt: dto.sellingPriceBdt,
        referrerBountyBdt: calculatedBounty,
        status: dto.status || 'PENDING',
        referrerId,
      },
    });

    return {
      success: true,
      message: `Referred deal "${dto.clientName}" created successfully with ৳${calculatedBounty.toLocaleString()} BDT commission bounty.`,
      deal,
    };
  }

  async updateDealStatus(dealId: string, status: string) {
    const deal = await this.prismaService.referrerDeal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found.');
    }

    const updated = await this.prismaService.referrerDeal.update({
      where: { id: dealId },
      data: { status },
    });

    return {
      success: true,
      message: `Deal status updated to ${status}.`,
      deal: updated,
    };
  }

  async deleteDeal(dealId: string) {
    const deal = await this.prismaService.referrerDeal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found.');
    }

    await this.prismaService.referrerDeal.delete({
      where: { id: dealId },
    });

    return {
      success: true,
      message: 'Deal deleted successfully.',
    };
  }
}
