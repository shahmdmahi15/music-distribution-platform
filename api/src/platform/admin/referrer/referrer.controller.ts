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
import { AdminReferrerService } from './referrer.service';
import { AdminReferrerQueryDto } from './dto/admin-referrer-query.dto';
import { UpdateReferrerStatusDto } from './dto/update-referrer-status.dto';
import { UpdateReferrerDossierDto } from './dto/update-referrer-dossier.dto';
import { CreateReferrerDealDto } from './dto/create-referrer-deal.dto';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';
import { Roles } from 'src/platform/decorator/roles.decorator';
import {
  ADMIN_ROLES,
  OWNER_ADMIN_ROLES,
  WHITELABEL_REVIEW_ROLES,
} from 'src/platform/session/session-auth.service';

@Controller('referrers')
export class AdminReferrerController {
  constructor(private readonly referrerService: AdminReferrerService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  async getReferrers(@Query() query: AdminReferrerQueryDto) {
    return await this.referrerService.getReferrers(query);
  }

  @Get(':id')
  @Roles(...ADMIN_ROLES)
  async getReferrerById(@Param('id') id: string) {
    return await this.referrerService.getReferrerById(id);
  }

  @Patch(':id/status')
  @Roles(...WHITELABEL_REVIEW_ROLES)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReferrerStatusDto,
  ) {
    return await this.referrerService.updateStatus(id, dto);
  }

  @Patch(':id/dossier')
  @Roles(...WHITELABEL_REVIEW_ROLES)
  async updateDossier(
    @Param('id') id: string,
    @Body() dto: UpdateReferrerDossierDto,
  ) {
    return await this.referrerService.updateDossier(id, dto);
  }

  @Post(':id/contract')
  @Roles(...WHITELABEL_REVIEW_ROLES)
  @UseInterceptors(FileInterceptor('file'))
  async uploadContract(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('email') adminEmail?: string,
  ) {
    return await this.referrerService.uploadContract(id, file, adminEmail);
  }

  @Get(':id/contract/preview')
  @Roles(...ADMIN_ROLES)
  async getContractPreview(@Param('id') id: string) {
    return await this.referrerService.getContractPreview(id);
  }

  @Post(':id/documents')
  @Roles(...WHITELABEL_REVIEW_ROLES)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id') referrerId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('docType') docType: string,
    @Body('name') name?: string,
  ) {
    return await this.referrerService.uploadDocument(
      referrerId,
      file,
      docType,
      name,
    );
  }

  @Get('documents/:docId/preview')
  @Roles(...ADMIN_ROLES)
  async getDocumentPreview(@Param('docId') docId: string) {
    return await this.referrerService.getDocumentPreview(docId);
  }

  @Delete('documents/:docId')
  @Roles(...WHITELABEL_REVIEW_ROLES)
  async deleteDocument(@Param('docId') docId: string) {
    return await this.referrerService.deleteDocument(docId);
  }

  @Post(':id/deals')
  @Roles(...OWNER_ADMIN_ROLES)
  async createDeal(
    @Param('id') referrerId: string,
    @Body() dto: CreateReferrerDealDto,
  ) {
    return await this.referrerService.createDeal(referrerId, dto);
  }

  @Patch('deals/:dealId/status')
  @Roles(...OWNER_ADMIN_ROLES)
  async updateDealStatus(
    @Param('dealId') dealId: string,
    @Body('status') status: string,
  ) {
    return await this.referrerService.updateDealStatus(dealId, status);
  }

  @Delete('deals/:dealId')
  @Roles(...OWNER_ADMIN_ROLES)
  async deleteDeal(@Param('dealId') dealId: string) {
    return await this.referrerService.deleteDeal(dealId);
  }
}
