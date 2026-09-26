import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientWhitelabelService } from './whitelabel.service';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';
import { CreateWhiteLabelDto } from './dto/create-whitelabel.dto';
import { UpdateBrandingDto } from 'src/platform/dto/update-branding.dto';
import {
  UpdateThemeDto,
  UpdateDomainDto,
  UpdateSsoDto,
  TestCredentialsDto,
  CreateApiKeyDto,
  UpdateWebhookDto,
  TestWebhookDto,
} from './dto/whitelabel-management.dto';
import {
  CreateClientPortalUserDto,
  UpdateClientPortalUserDto,
  ResetClientPortalUserPasswordDto,
} from './dto/client-portal-user.dto';
import { ClientSetupWhiteLabelDto } from './dto/client-setup-whitelabel.dto';
import { WhitelabelProvisioningService } from './provisioning/whitelabel-provisioning.service';
import {
  ValidateCloudCredentialsDto,
  StartCloudProvisioningDto,
  SaveCloudCredentialsDto,
} from './dto/client-cloud-provisioning.dto';

@Controller('whitelabel')
export class ClientWhitelabelController {
  constructor(
    private readonly clientWhitelabelService: ClientWhitelabelService,
    private readonly provisioningService: WhitelabelProvisioningService,
  ) {}

  @Get('subdomain/check')
  async checkSubdomain(
    @Query('subdomain') subdomain: string,
    @CurrentUser('id') userId?: string,
  ) {
    return await this.clientWhitelabelService.checkSubdomainAvailability(
      subdomain || '',
      userId,
    );
  }

  @Get('subdomain/suggest')
  async suggestSubdomain(@Query('name') name: string) {
    return await this.clientWhitelabelService.suggestUniqueSubdomain(
      name || '',
    );
  }

  @Get('onboarding/draft')
  async getOnboardingDraft(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getOnboardingDraft(userId);
  }

  @Post('onboarding/draft')
  async saveOnboardingDraft(
    @CurrentUser('id') userId: string,
    @Body() draft: any,
  ) {
    return await this.clientWhitelabelService.saveOnboardingDraft(
      userId,
      draft,
    );
  }

  @Delete('onboarding/draft')
  async clearOnboardingDraft(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.clearOnboardingDraft(userId);
  }

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

  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') documentType?: string,
    @Body('name') title?: string,
  ) {
    return await this.clientWhitelabelService.uploadDocument(
      userId,
      file,
      documentType || 'SUPPLEMENTARY_DOCUMENT',
      title,
    );
  }

  @Get('documents/:docId/preview')
  async getDocumentPreview(
    @CurrentUser('id') userId: string,
    @Param('docId') docId: string,
  ) {
    return await this.clientWhitelabelService.getDocumentPreview(userId, docId);
  }

  @Delete('documents/:docId')
  async deleteDocument(
    @CurrentUser('id') userId: string,
    @Param('docId') docId: string,
  ) {
    return await this.clientWhitelabelService.deleteDocument(userId, docId);
  }

  @Get('branding')
  async getBranding(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getBranding(userId);
  }

  @Post('setup')
  async completeSetup(
    @CurrentUser('id') userId: string,
    @Body() dto: ClientSetupWhiteLabelDto,
  ) {
    return await this.clientWhitelabelService.completeSetup(userId, dto);
  }

  @Patch('branding')
  async updateBranding(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBrandingDto,
  ) {
    return await this.clientWhitelabelService.updateBranding(userId, dto);
  }

  @Get('policy')
  async getRegistrationPolicy(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getRegistrationPolicy(userId);
  }

  @Patch('policy')
  async updateRegistrationPolicy(
    @CurrentUser('id') userId: string,
    @Body() dto: { userSignupModel?: any; policySettings?: Record<string, any> },
  ) {
    return await this.clientWhitelabelService.updateRegistrationPolicy(
      userId,
      dto,
    );
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
    @Body() dto: UpdateThemeDto,
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
    @Body() dto: UpdateDomainDto,
  ) {
    return await this.clientWhitelabelService.updateDomain(userId, dto);
  }

  @Post('domain/verify')
  async verifyDomainDns(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.verifyDomainDns(userId);
  }

  @Post('domain/verify-cloudflare')
  async verifyCloudflareInterconnection(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.verifyCloudflareInterconnection(
      userId,
    );
  }

  @Post('domain/hold-and-verify')
  async holdAndVerifyCustomDomain(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.holdAndVerifyCustomDomain(userId);
  }

  @Post('domain/apply-cname')
  async applyCnameRouting(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.applyCnameRouting(userId);
  }

  @Post('domain/sync-subdomain')
  async syncPlatformSubdomainDns(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.syncPlatformSubdomainDns(userId);
  }

  @Get('domain/health')
  async getDomainHealth(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getDomainHealth(userId, false);
  }

  @Post('domain/health')
  async refreshDomainHealth(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getDomainHealth(userId, true);
  }

  // --- Credentials & SSO ---
  @Get('sso')
  async getSsoConfig(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getSsoConfig(userId);
  }

  @Patch('sso')
  async updateSsoConfig(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSsoDto,
  ) {
    return await this.clientWhitelabelService.updateSsoConfig(userId, dto);
  }

  @Post('credentials/test')
  async testCredentials(
    @CurrentUser('id') userId: string,
    @Body() dto: TestCredentialsDto,
  ) {
    return await this.clientWhitelabelService.testCredentials(userId, dto);
  }

  // --- API Keys ---
  @Get('api-keys')
  async getApiKeys(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getApiKeys(userId);
  }

  @Post('api-keys')
  async createApiKey(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateApiKeyDto,
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
    @Body() dto: UpdateWebhookDto,
  ) {
    return await this.clientWhitelabelService.updateWebhooks(userId, dto);
  }

  @Post('webhooks/test')
  async testWebhook(
    @CurrentUser('id') userId: string,
    @Body() dto?: TestWebhookDto,
  ) {
    return await this.clientWhitelabelService.testWebhook(userId, dto);
  }

  // --- Portal Users ---
  @Get('users')
  async getPortalUsers(@CurrentUser('id') userId: string) {
    return await this.clientWhitelabelService.getPortalUsers(userId);
  }

  @Post('users')
  async createPortalUser(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateClientPortalUserDto,
  ) {
    return await this.clientWhitelabelService.createPortalUser(userId, dto);
  }

  @Patch('users/:id')
  async updatePortalUser(
    @CurrentUser('id') userId: string,
    @Param('id') targetUserId: string,
    @Body() dto: UpdateClientPortalUserDto,
  ) {
    return await this.clientWhitelabelService.updatePortalUser(
      userId,
      targetUserId,
      dto,
    );
  }

  @Patch('users/:id/password')
  async resetPortalUserPassword(
    @CurrentUser('id') userId: string,
    @Param('id') targetUserId: string,
    @Body() dto: ResetClientPortalUserPasswordDto,
  ) {
    return await this.clientWhitelabelService.resetPortalUserPassword(
      userId,
      targetUserId,
      dto,
    );
  }

  @Patch('users/:id/lock')
  async toggleLockPortalUser(
    @CurrentUser('id') userId: string,
    @Param('id') targetUserId: string,
  ) {
    return await this.clientWhitelabelService.toggleLockPortalUser(
      userId,
      targetUserId,
    );
  }

  @Post('users/:id/approve')
  async approvePortalUser(
    @CurrentUser('id') userId: string,
    @Param('id') targetUserId: string,
  ) {
    return await this.clientWhitelabelService.approvePortalUser(
      userId,
      targetUserId,
    );
  }

  @Patch('users/:id/approve')
  async approvePortalUserPatch(
    @CurrentUser('id') userId: string,
    @Param('id') targetUserId: string,
  ) {
    return await this.clientWhitelabelService.approvePortalUser(
      userId,
      targetUserId,
    );
  }

  @Delete('users/:id')
  async deletePortalUser(
    @CurrentUser('id') userId: string,
    @Param('id') targetUserId: string,
  ) {
    return await this.clientWhitelabelService.deletePortalUser(
      userId,
      targetUserId,
    );
  }

  // Multi-Cloud Infrastructure Automation (AWS EC2, S3, SES + Cloudflare)
  @Post('provision/validate')
  async validateCloudCredentials(
    @CurrentUser('id') userId: string,
    @Body() dto: ValidateCloudCredentialsDto,
  ) {
    return await this.provisioningService.validateCloudCredentials(dto, userId);
  }

  @Post('provision/credentials')
  async saveCloudCredentials(
    @CurrentUser('id') userId: string,
    @Body() dto: SaveCloudCredentialsDto,
  ) {
    return await this.provisioningService.saveCloudCredentials(userId, dto);
  }

  @Post('provision/start')
  async startCloudProvisioning(
    @CurrentUser('id') userId: string,
    @Body() dto: StartCloudProvisioningDto,
  ) {
    return await this.provisioningService.startProvisioning(userId, dto);
  }

  @Get('provision/status')
  async getProvisioningStatus(@CurrentUser('id') userId: string) {
    return await this.provisioningService.getProvisioningStatus(userId);
  }
}
