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
import {
  ContractLevel,
  ContractStatus,
  MechanicalType,
  PayeeRole,
} from 'src/generated/prisma/client';
import {
  ContractSplitItemDto,
  CreateContractDto,
} from './dto/create-contract.dto';

export { ContractLevel, ContractSplitItemDto, CreateContractDto };

export interface ResolveEffectiveContractParams {
  whiteLabelId: string;
  trackId?: string;
  releaseId?: string;
  artistId?: string;
  labelId?: string;
}

@Injectable()
export class WhitelabelContractsService {
  private readonly logger = new Logger(WhitelabelContractsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new contract with payee revenue share splits.
   * Strictly enforces that total split percentages equal exactly 100%.
   */
  async createContract(dto: CreateContractDto) {
    if (!dto.splits || dto.splits.length === 0) {
      throw new BadRequestException('Contract must contain at least one payee split');
    }

    const hasNonPositive = dto.splits.some((s) => s.percentage <= 0);
    if (hasNonPositive) {
      throw new BadRequestException('Split percentages must be strictly positive');
    }

    const totalPercentage = dto.splits.reduce((acc, curr) => acc + Number(curr.percentage), 0);
    if (Math.abs(totalPercentage - 100) > 0.001) {
      throw new BadRequestException(
        `Total payee split percentage must equal exactly 100% (currently ${totalPercentage}%)`,
      );
    }

    let code: string;
    try {
      code = await generateUniqueCode(
        this.prisma,
        'contract',
        CodePrefix.CONTRACT,
      );
    } catch {
      code = `RMIT-CTR-${Date.now()}`;
    }

    const level = dto.level || ContractLevel.RELEASE;

    const contractData: any = {
      code,
      title: dto.name,
      level,
      status: dto.status || ContractStatus.ACTIVE,
      whiteLabelId: dto.whiteLabelId,
      allFutureAssets: dto.allFutureAssets ?? false,
      payMechanicals: dto.payMechanicals ?? false,
      mechanicalType: dto.mechanicalType,
      advanceAmount: dto.advanceAmount ?? 0,
      contractPayees: {
        create: dto.splits.map((s) => ({
          payeeId: s.payeeId,
          sharePercentage: s.percentage,
          role: s.role || PayeeRole.ARTIST,
        })),
      },
    };

    if (dto.targetId) {
      contractData.contractAssets = {
        create: [
          {
            trackId: level === ContractLevel.TRACK ? dto.targetId : undefined,
            releaseId: level === ContractLevel.RELEASE ? dto.targetId : undefined,
            artistName: level === ContractLevel.ARTIST ? dto.targetId : undefined,
            labelName: level === ContractLevel.LABEL ? dto.targetId : undefined,
          },
        ],
      };
    }

    const created = await this.prisma.contract.create({
      data: contractData,
      include: {
        contractPayees: {
          include: {
            payee: true,
          },
        },
        contractAssets: true,
      },
    });

    return {
      ...created,
      targetId: dto.targetId,
      splits: dto.splits,
    };
  }

  /**
   * Resolves effective contract and split hierarchy for track/release royalties.
   * Precedence Hierarchy:
   * 1. Track Level Contract (Highest)
   * 2. Release Level Contract
   * 3. Artist Level Contract
   * 4. Account Default Contract (Lowest)
   */
  async resolveEffectiveContract(params: ResolveEffectiveContractParams) {
    const { whiteLabelId, trackId, releaseId, artistId, labelId } = params;

    // 1. Track Level Contract
    if (trackId) {
      const trackContract = await this.prisma.contract.findFirst({
        where: {
          whiteLabelId,
          level: ContractLevel.TRACK,
          targetId: trackId,
        } as any,
        include: {
          contractPayees: {
            include: { payee: true },
          },
        },
      });

      if (trackContract) {
        return this.formatContractResult(trackContract);
      }
    }

    // 2. Release Level Contract
    if (releaseId) {
      const releaseContract = await this.prisma.contract.findFirst({
        where: {
          whiteLabelId,
          level: ContractLevel.RELEASE,
          targetId: releaseId,
        } as any,
        include: {
          contractPayees: {
            include: { payee: true },
          },
        },
      });

      if (releaseContract) {
        return this.formatContractResult(releaseContract);
      }
    }

    // 3. Artist Level Contract
    if (artistId) {
      const artistContract = await this.prisma.contract.findFirst({
        where: {
          whiteLabelId,
          level: ContractLevel.ARTIST,
          targetId: artistId,
        } as any,
        include: {
          contractPayees: {
            include: { payee: true },
          },
        },
      });

      if (artistContract) {
        return this.formatContractResult(artistContract);
      }
    }

    // 4. Account Default Contract
    const accountContract = await this.prisma.contract.findFirst({
      where: {
        whiteLabelId,
        level: ContractLevel.ACCOUNT,
      } as any,
      include: {
        contractPayees: {
          include: { payee: true },
        },
      },
    });

    if (accountContract) {
      return this.formatContractResult(accountContract);
    }

    throw new NotFoundException(
      'No active contract found in hierarchy for the specified assets',
    );
  }

  private formatContractResult(contract: any) {
    const splits = (contract.contractPayees || []).map((cp: any) => ({
      payeeId: cp.payeeId,
      percentage: Number(cp.sharePercentage),
      role: cp.role,
      payee: cp.payee,
    }));

    return {
      ...contract,
      splits,
    };
  }

  async listContracts(
    whiteLabelId: string,
    query?: { level?: ContractLevel; page?: number; limit?: number },
  ) {
    const page = Math.max(1, query?.page || 1);
    const limit = Math.max(1, Math.min(100, query?.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { whiteLabelId };
    if (query?.level) {
      where.level = query.level;
    }

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contractPayees: {
            include: { payee: true },
          },
          contractAssets: true,
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return {
      data: contracts.map((c) => this.formatContractResult(c)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getContract(whiteLabelId: string, code: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { code, whiteLabelId },
      include: {
        contractPayees: {
          include: { payee: true },
        },
        contractAssets: true,
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with code ${code} not found`);
    }

    return this.formatContractResult(contract);
  }
}
