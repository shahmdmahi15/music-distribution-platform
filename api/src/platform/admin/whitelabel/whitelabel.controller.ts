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
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';

@Controller('whitelabels')
export class AdminWhitelabelController {
  constructor(
    private readonly adminWhitelabelService: AdminWhitelabelService,
  ) {}

  @Get()
  async getWhiteLabels(@Query() query: AdminWhiteLabelQueryDto) {
    return await this.adminWhitelabelService.getWhiteLabels(query);
  }

  @Get(':id')
  async getWhiteLabelById(@Param('id') id: string) {
    return await this.adminWhitelabelService.getWhiteLabelById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWhiteLabelStatusDto,
  ) {
    return await this.adminWhitelabelService.updateStatus(id, dto);
  }

  @Post(':id/record-payment')
  async recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return await this.adminWhitelabelService.recordPayment(id, dto);
  }

  @Post(':id/activate')
  async activateWhiteLabel(@Param('id') id: string) {
    return await this.adminWhitelabelService.activateWhiteLabel(id);
  }

  @Post(':id/suspend')
  async suspendWhiteLabel(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return await this.adminWhitelabelService.suspendWhiteLabel(id, reason);
  }

  @Post(':id/unsuspend')
  async unsuspendWhiteLabel(@Param('id') id: string) {
    return await this.adminWhitelabelService.unsuspendWhiteLabel(id);
  }

  @Post(':id/documents')
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
  async getDocuments(@Param('id') whiteLabelId: string) {
    return await this.adminWhitelabelService.getDocuments(whiteLabelId);
  }

  @Delete('documents/:docId')
  async deleteDocument(@Param('docId') docId: string) {
    return await this.adminWhitelabelService.deleteDocument(docId);
  }

  @Delete('payments/:paymentId')
  async deletePayment(@Param('paymentId') paymentId: string) {
    return await this.adminWhitelabelService.deletePayment(paymentId);
  }

  @Get(':id/branding')
  async getBranding(@Param('id') whiteLabelId: string) {
    return await this.adminWhitelabelService.getBranding(whiteLabelId);
  }

  @Patch(':id/branding')
  async updateBranding(
    @Param('id') whiteLabelId: string,
    @Body() dto: any,
  ) {
    return await this.adminWhitelabelService.updateBranding(whiteLabelId, dto);
  }

  @Post(':id/branding/asset')
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
