import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WhitelabelContractsService } from './whitelabel-contracts.service';
import { WhitelabelSessionGuard } from '../guard/whitelabel-session.guard';
import { CurrentWhiteLabel } from '../decorator/current-whitelabel.decorator';
import { ContractLevel } from 'src/generated/prisma/client';
import type { WhiteLabel } from 'src/generated/prisma/client';
import { CreateContractDto } from './dto/create-contract.dto';

@Controller('contracts')
@UseGuards(WhitelabelSessionGuard)
export class WhitelabelContractsController {
  constructor(private readonly contractsService: WhitelabelContractsService) {}

  @Post()
  async createContract(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Body() dto: Omit<CreateContractDto, 'whiteLabelId'>,
  ) {
    return await this.contractsService.createContract({
      ...dto,
      whiteLabelId: whiteLabel.id,
    });
  }

  @Get()
  async listContracts(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Query('level') level?: ContractLevel,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.contractsService.listContracts(whiteLabel.id, {
      level,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('effective-split')
  async getEffectiveSplit(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Query('trackId') trackId?: string,
    @Query('releaseId') releaseId?: string,
    @Query('artistId') artistId?: string,
  ) {
    return await this.contractsService.resolveEffectiveContract({
      whiteLabelId: whiteLabel.id,
      trackId,
      releaseId,
      artistId,
    });
  }

  @Get(':code')
  async getContract(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('code') code: string,
  ) {
    if (code === 'payees' || code === 'effective-split') {
      throw new NotFoundException(`Resource not found for ${code}`);
    }
    return await this.contractsService.getContract(whiteLabel.id, code);
  }
}
