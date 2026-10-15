import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WhitelabelCatalogService } from './whitelabel-catalog.service';
import { WhitelabelQcValidationService } from './validation/whitelabel-qc-validation.service';
import { WhitelabelSessionGuard } from '../guard/whitelabel-session.guard';
import { CurrentWhiteLabel } from '../decorator/current-whitelabel.decorator';
import { CurrentWhiteLabelUser } from '../decorator/current-whitelabel-user.decorator';
import type { WhiteLabel, WhiteLabelUser } from 'src/generated/prisma/client';
import { CreateReleaseDto } from './dto/create-release.dto';
import { UpdateReleaseDto } from './dto/update-release.dto';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { QueryReleaseDto } from './dto/query-release.dto';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';

@Controller('catalog')
@UseGuards(WhitelabelSessionGuard)
export class WhitelabelCatalogController {
  constructor(
    private readonly catalogService: WhitelabelCatalogService,
    private readonly qcValidationService: WhitelabelQcValidationService,
  ) {}

  @Post('upload-url')
  async getUploadUrl(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Body() dto: RequestUploadUrlDto,
  ) {
    return await this.catalogService.getUploadUrl(whiteLabel.id, dto);
  }

  @Post('releases')
  async createRelease(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @CurrentWhiteLabelUser() currentUser: WhiteLabelUser,
    @Body() dto: CreateReleaseDto,
  ) {
    return await this.catalogService.createReleaseDraft(
      whiteLabel.id,
      currentUser.id,
      dto,
    );
  }

  @Get('releases')
  async listReleases(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Query() query: QueryReleaseDto,
  ) {
    return await this.catalogService.getReleases(whiteLabel.id, query);
  }

  @Get('releases/:code')
  async getRelease(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('code') code: string,
  ) {
    return await this.catalogService.getReleaseByCode(whiteLabel.id, code);
  }

  @Post('releases/:code/validate')
  async validateRelease(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('code') code: string,
  ) {
    return await this.qcValidationService.validateRelease(whiteLabel.id, code);
  }

  @Put('releases/:code')
  async updateRelease(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('code') code: string,
    @Body() dto: UpdateReleaseDto,
  ) {
    return await this.catalogService.updateRelease(whiteLabel.id, code, dto);
  }

  @Post('releases/:code/submit')
  async submitRelease(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('code') code: string,
  ) {
    return await this.catalogService.submitRelease(whiteLabel.id, code);
  }

  @Post('releases/:code/tracks')
  async addTrack(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('code') code: string,
    @Body() dto: CreateTrackDto,
  ) {
    return await this.catalogService.addTrack(whiteLabel.id, code, dto);
  }

  @Put('releases/:code/tracks/:trackCode')
  async updateTrack(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('code') code: string,
    @Param('trackCode') trackCode: string,
    @Body() dto: UpdateTrackDto,
  ) {
    return await this.catalogService.updateTrack(
      whiteLabel.id,
      code,
      trackCode,
      dto,
    );
  }

  @Delete('releases/:code/tracks/:trackCode')
  async deleteTrack(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('code') code: string,
    @Param('trackCode') trackCode: string,
  ) {
    return await this.catalogService.deleteTrack(
      whiteLabel.id,
      code,
      trackCode,
    );
  }

  @Get('tracks/:trackCode/stream')
  async streamTrack(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('trackCode') trackCode: string,
  ) {
    return await this.catalogService.getAudioPresignedUrl(
      whiteLabel.id,
      trackCode,
    );
  }

  @Post('channels')
  async requestVevoChannel(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @CurrentWhiteLabelUser() currentUser: WhiteLabelUser,
    @Body() dto: any,
  ) {
    return await this.catalogService.requestVevoChannel(
      whiteLabel.id,
      currentUser.id,
      dto,
    );
  }

  @Get('channels')
  async listVevoChannels(@CurrentWhiteLabel() whiteLabel: WhiteLabel) {
    return await this.catalogService.listVevoChannels(whiteLabel.id);
  }

  @Patch('releases/:code/correction')
  async patchReleaseCorrection(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('code') code: string,
    @Body() dto: UpdateReleaseDto,
  ) {
    return await this.catalogService.patchReleaseCorrection(
      whiteLabel.id,
      code,
      dto,
    );
  }
}
