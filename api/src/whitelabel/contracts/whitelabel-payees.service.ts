import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import {
  CodePrefix,
  generateUniqueCode,
} from 'src/lib/prisma/code-generator';
import { CreatePayeeDto } from './dto/create-payee.dto';

@Injectable()
export class WhitelabelPayeesService {
  private readonly logger = new Logger(WhitelabelPayeesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPayee(whiteLabelId: string, dto: CreatePayeeDto) {
    const code = await generateUniqueCode(
      this.prisma,
      'payee',
      CodePrefix.PAYEE,
    );

    return await this.prisma.payee.create({
      data: {
        code,
        name: dto.name,
        email: dto.email,
        legalName: dto.legalName,
        taxId: dto.taxId,
        role: dto.role,
        status: dto.status,
        paymentMethod: dto.paymentMethod || 'BANK_TRANSFER',
        paymentDetails: dto.paymentDetails || undefined,
        whiteLabelId,
      },
    });
  }

  async listPayees(
    whiteLabelId: string,
    query?: { search?: string; page?: number; limit?: number },
  ) {
    const page = Math.max(1, query?.page || 1);
    const limit = Math.max(1, Math.min(100, query?.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { whiteLabelId };
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [payees, total] = await Promise.all([
      this.prisma.payee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contractPayees: {
            include: {
              contract: true,
            },
          },
        },
      }),
      this.prisma.payee.count({ where }),
    ]);

    return {
      data: payees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPayee(whiteLabelId: string, code: string) {
    const payee = await this.prisma.payee.findFirst({
      where: { code, whiteLabelId },
      include: {
        contractPayees: {
          include: {
            contract: true,
          },
        },
        statements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!payee) {
      throw new NotFoundException(`Payee with code ${code} not found`);
    }

    return payee;
  }

  async updatePayee(
    whiteLabelId: string,
    code: string,
    dto: Partial<CreatePayeeDto>,
  ) {
    const existing = await this.prisma.payee.findFirst({
      where: { code, whiteLabelId },
    });

    if (!existing) {
      throw new NotFoundException(`Payee with code ${code} not found`);
    }

    return await this.prisma.payee.update({
      where: { id: existing.id },
      data: {
        name: dto.name ?? existing.name,
        email: dto.email ?? existing.email,
        legalName: dto.legalName ?? existing.legalName,
        taxId: dto.taxId ?? existing.taxId,
        role: dto.role ?? existing.role,
        status: dto.status ?? existing.status,
        paymentMethod: dto.paymentMethod ?? existing.paymentMethod,
        paymentDetails: dto.paymentDetails ?? (existing.paymentDetails as any),
      },
    });
  }
}
