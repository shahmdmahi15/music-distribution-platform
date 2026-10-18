import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ClientCatalogService } from './client-catalog.service';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';
import {
  QueryClientReleasesDto,
  RejectChannelDto,
  RejectReleaseDto,
} from './dto/client-catalog.dto';

@Controller('whitelabel/catalog')
export class ClientCatalogController {
  constructor(private readonly catalogService: ClientCatalogService) {}

  @Get('releases')
  async listReleases(
    @CurrentUser('id') userId: string,
    @Query() query: QueryClientReleasesDto,
  ) {
    return await this.catalogService.listReleases(userId, query);
  }

  @Get('releases/:code')
  async getRelease(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ) {
    return await this.catalogService.getRelease(userId, code);
  }

  @Post('releases/:code/approve')
  async approveRelease(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
    @Body('notes') notes?: string,
  ) {
    return await this.catalogService.approveRelease(userId, code, notes);
  }

  @Post('releases/:code/reject')
  async rejectRelease(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
    @Body() dto: RejectReleaseDto,
  ) {
    return await this.catalogService.rejectRelease(userId, code, dto);
  }

  @Get('channels')
  async listChannels(@CurrentUser('id') userId: string) {
    return await this.catalogService.listChannels(userId);
  }

  @Post('channels/:code/approve')
  async approveChannel(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ) {
    return await this.catalogService.approveChannel(userId, code);
  }

  @Post('channels/:code/reject')
  async rejectChannel(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
    @Body() dto: RejectChannelDto,
  ) {
    return await this.catalogService.rejectChannel(userId, code, dto);
  }
}
