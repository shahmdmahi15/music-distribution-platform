import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientWhitelabelService } from './whitelabel.service';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';
import { CreateWhiteLabelDto } from 'src/whitelabel/dto/create-whitelabel.dto';

@Controller('whitelabel')
export class ClientWhitelabelController {
  constructor(
    private readonly clientWhitelabelService: ClientWhitelabelService,
  ) {}

  @Post('apply')
  async apply(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWhiteLabelDto,
  ) {
    return await this.clientWhitelabelService.apply(userId, dto);
  }

  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getStatus(userId);
  }

  @Get('documents')
  async getDocuments(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getDocuments(userId);
  }

  @Get('branding')
  async getBranding(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getBranding(userId);
  }

  @Patch('branding')
  async updateBranding(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return await this.clientWhitelabelService.updateBranding(userId, dto);
  }

  @Post('branding/asset')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBrandingAsset(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('assetType') assetType: 'logo' | 'logoDark' | 'favicon' | 'banner',
  ) {
    return await this.clientWhitelabelService.uploadBrandingAsset(
      userId,
      file,
      assetType || 'logo',
    );
  }

  @Delete('branding/asset/:assetType')
  async deleteBrandingAsset(
    @CurrentUser('id') userId: string,
    @Param('assetType') assetType: 'logo' | 'logoDark' | 'favicon' | 'banner',
  ) {
    return await this.clientWhitelabelService.deleteBrandingAsset(
      userId,
      assetType,
    );
  }
}
