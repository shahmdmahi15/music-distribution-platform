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
import { AdminWhitelabelService } from './whitelabel.service';
import { AdminWhiteLabelQueryDto } from './dto/admin-whitelabel-query.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { UpdateWhiteLabelStatusDto } from './dto/update-status.dto';
import { AdminUpdateBrandingDto } from './dto/admin-update-branding.dto';
import { AdminUpdateApplicationDto } from './dto/admin-update-application.dto';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';
import { Roles } from 'src/platform/decorator/roles.decorator';
import {
  ADMIN_ROLES,
  OWNER_ADMIN_ROLES,
  WHITELABEL_REVIEW_ROLES,
} from 'src/platform/session/session-auth.service';

@Controller('whitelabels')
export class AdminWhitelabelController {
  constructor(
    private readonly adminWhitelabelService: AdminWhitelabelService,
  ) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  async getWhiteLabels(@Query() query: AdminWhiteLabelQueryDto) {
    return await this.adminWhitelabelService.getWhiteLabels(query);
  }

  @Get(':id')
  @Roles(...ADMIN_ROLES)
  async getWhiteLabelById(@Param('id') id: string) {
    return await this.adminWhitelabelService.getWhiteLabelById(id);
  }

  @Patch(':id/status')
  @Roles(...WHITELABEL_REVIEW_ROLES)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWhiteLabelStatusDto,
  ) {
    return await this.adminWhitelabelService.updateStatus(id, dto);
  }

  @Patch(':id/application')
  @Roles(...WHITELABEL_REVIEW_ROLES)
  async updateApplication(
    @Param('id') id: string,
    @Body() dto: AdminUpdateApplicationDto,
  ) {
    return await this.adminWhitelabelService.updateApplication(id, dto);
  }

  @Post(':id/sync-dns')
  @Roles(...WHITELABEL_REVIEW_ROLES)
  async syncCloudflareDns(@Param('id') id: string) {
    return await this.adminWhitelabelService.syncCloudflareDns(id);
  }

  @Post(':id/contract')
  @Roles(...WHITELABEL_REVIEW_ROLES)
  @UseInterceptors(FileInterceptor('file'))
  async uploadContract(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('email') adminEmail?: string,
  ) {
    return await this.adminWhitelabelService.uploadContract(
      id,
      file,
      adminEmail,
    );
  }

  @Get(':id/contract/preview')
  @Roles(...ADMIN_ROLES)
  async getContractPreview(@Param('id') id: string) {
    return await this.adminWhitelabelService.getContractPreview(id);
  }

  @Post(':id/record-payment')
  @Roles(...OWNER_ADMIN_ROLES)
  async recordPayment(@Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return await this.adminWhitelabelService.recordPayment(id, dto);
  }

  @Post(':id/activate')
  @Roles(...OWNER_ADMIN_ROLES)
  async activateWhiteLabel(@Param('id') id: string) {
    return await this.adminWhitelabelService.activateWhiteLabel(id);
  }

  @Post(':id/suspend')
  @Roles(...OWNER_ADMIN_ROLES)
  async suspendWhiteLabel(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return await this.adminWhitelabelService.suspendWhiteLabel(id, reason);
  }

  @Post(':id/unsuspend')
  @Roles(...OWNER_ADMIN_ROLES)
  async unsuspendWhiteLabel(@Param('id') id: string) {
    return await this.adminWhitelabelService.unsuspendWhiteLabel(id);
  }

  @Post(':id/documents')
  @Roles(...WHITELABEL_REVIEW_ROLES)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id') whiteLabelId: string,
    @CurrentUser('id') adminUserId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @Body('title') title?: string,
  ) {
    return await this.adminWhitelabelService.uploadDocument(
      whiteLabelId,
      file,
      documentType,
      title,
      adminUserId,
    );
  }

  @Get(':id/documents')
  @Roles(...ADMIN_ROLES)
  async getDocuments(@Param('id') whiteLabelId: string) {
    return await this.adminWhitelabelService.getDocuments(whiteLabelId);
  }

  @Get('documents/:docId/preview')
  @Roles(...ADMIN_ROLES)
  async getDocumentPreview(@Param('docId') docId: string) {
    return await this.adminWhitelabelService.getDocumentPreview(docId);
  }

  @Delete('documents/:docId')
  @Roles(...WHITELABEL_REVIEW_ROLES)
  async deleteDocument(@Param('docId') docId: string) {
    return await this.adminWhitelabelService.deleteDocument(docId);
  }

  @Delete('payments/:paymentId')
  @Roles(...OWNER_ADMIN_ROLES)
  async deletePayment(@Param('paymentId') paymentId: string) {
    return await this.adminWhitelabelService.deletePayment(paymentId);
  }

  @Get(':id/branding')
  @Roles(...ADMIN_ROLES)
  async getBranding(@Param('id') whiteLabelId: string) {
    return await this.adminWhitelabelService.getBranding(whiteLabelId);
  }

  @Patch(':id/branding')
  @Roles(...WHITELABEL_REVIEW_ROLES)
  async updateBranding(
    @Param('id') whiteLabelId: string,
    @Body() dto: AdminUpdateBrandingDto,
  ) {
    return await this.adminWhitelabelService.updateBranding(whiteLabelId, dto);
  }

  @Post(':id/branding/asset')
  @Roles(...WHITELABEL_REVIEW_ROLES)
  @UseInterceptors(FileInterceptor('file'))
  async uploadBrandingAsset(
    @Param('id') whiteLabelId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('assetType') assetType: 'logo' | 'logoDark' | 'favicon' | 'banner',
  ) {
    return await this.adminWhitelabelService.uploadBrandingAsset(
      whiteLabelId,
      file,
      assetType || 'logo',
    );
  }

  @Delete(':id/branding/asset/:assetType')
  @Roles(...WHITELABEL_REVIEW_ROLES)
  async deleteBrandingAsset(
    @Param('id') whiteLabelId: string,
    @Param('assetType') assetType: 'logo' | 'logoDark' | 'favicon' | 'banner',
  ) {
    return await this.adminWhitelabelService.deleteBrandingAsset(
      whiteLabelId,
      assetType,
    );
  }
}
