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
import { CreateWhiteLabelDto } from './dto/create-whitelabel.dto';
import { UpdateBrandingDto } from 'src/platform/dto/update-branding.dto';

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

  @Get('contract/preview')
  async getContractPreview(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getContractPreview(userId);
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
    @Body() dto: UpdateBrandingDto,
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

  // --- Theme Customizer ---
  @Get('theme')
  async getTheme(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getTheme(userId);
  }

  @Patch('theme')
  async updateTheme(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return await this.clientWhitelabelService.updateTheme(userId, dto);
  }

  // --- Domain & DNS ---
  @Get('domain')
  async getDomainConfig(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getDomainConfig(userId);
  }

  @Patch('domain')
  async updateDomain(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return await this.clientWhitelabelService.updateDomain(userId, dto);
  }

  @Post('domain/verify')
  async verifyDomainDns(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.verifyDomainDns(userId);
  }

  // --- Credentials & SSO ---
  @Get('sso')
  async getSsoConfig(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getSsoConfig(userId);
  }

  @Patch('sso')
  async updateSsoConfig(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return await this.clientWhitelabelService.updateSsoConfig(userId, dto);
  }

  // --- API Keys ---
  @Get('api-keys')
  async getApiKeys(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getApiKeys(userId);
  }

  @Post('api-keys')
  async createApiKey(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return await this.clientWhitelabelService.createApiKey(userId, dto);
  }

  @Delete('api-keys/:id')
  async revokeApiKey(
    @CurrentUser('id') userId: string,
    @Param('id') keyId: string,
  ) {
    return await this.clientWhitelabelService.revokeApiKey(userId, keyId);
  }

  // --- Webhooks ---
  @Get('webhooks')
  async getWebhooks(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getWebhooks(userId);
  }

  @Patch('webhooks')
  async updateWebhooks(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return await this.clientWhitelabelService.updateWebhooks(userId, dto);
  }

  @Post('webhooks/test')
  async testWebhook(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return await this.clientWhitelabelService.testWebhook(userId, dto);
  }

  // --- Portal Users ---
  @Get('users')
  async getPortalUsers(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getPortalUsers(userId);
  }
}


