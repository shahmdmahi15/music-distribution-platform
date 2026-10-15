import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WhitelabelPayeesService } from './whitelabel-payees.service';
import { WhitelabelSessionGuard } from '../guard/whitelabel-session.guard';
import { CurrentWhiteLabel } from '../decorator/current-whitelabel.decorator';
import type { WhiteLabel } from 'src/generated/prisma/client';
import { CreatePayeeDto } from './dto/create-payee.dto';

@Controller('contracts/payees')
@UseGuards(WhitelabelSessionGuard)
export class WhitelabelPayeesController {
  constructor(private readonly payeesService: WhitelabelPayeesService) {}

  @Post()
  async createPayee(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Body() dto: CreatePayeeDto,
  ) {
    return await this.payeesService.createPayee(whiteLabel.id, dto);
  }

  @Get()
  async listPayees(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.payeesService.listPayees(whiteLabel.id, {
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':code')
  async getPayee(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('code') code: string,
  ) {
    return await this.payeesService.getPayee(whiteLabel.id, code);
  }

  @Patch(':code')
  async updatePayee(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('code') code: string,
    @Body() dto: Partial<CreatePayeeDto>,
  ) {
    return await this.payeesService.updatePayee(whiteLabel.id, code, dto);
  }
}
