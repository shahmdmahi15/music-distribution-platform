import {
  Body,
  Controller,
  Get,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { WhitelabelSystemService } from './whitelabel-system.service';
import { CurrentWhiteLabel } from '../decorator/current-whitelabel.decorator';
import type { WhiteLabel } from 'src/generated/prisma/client';
import { WhitelabelTelemetryDto } from './dto/whitelabel-telemetry.dto';

@Controller('system')
export class WhitelabelSystemController {
  constructor(private readonly systemService: WhitelabelSystemService) {}

  /**
   * Version check endpoint called by client EC2 self-updater daemon.
   */
  @Get('version')
  async getVersion(@CurrentWhiteLabel() whiteLabel: WhiteLabel) {
    return await this.systemService.getVersionManifest(whiteLabel.id);
  }

  /**
   * Secure bundle download endpoint authenticated by tenant x-api-key.
   */
  @Get('bundle')
  async downloadBundle(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Res() res: Response,
  ) {
    return await this.systemService.streamBundle(whiteLabel.id, res);
  }

  /**
   * Telemetry reporting endpoint called by client EC2 self-updater daemon.
   */
  @Post('telemetry')
  async reportTelemetry(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Body() dto: WhitelabelTelemetryDto,
  ) {
    return await this.systemService.recordTelemetry(whiteLabel.id, dto);
  }
}
