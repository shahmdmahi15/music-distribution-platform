import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientReferrerService } from './referrer.service';
import { CreateReferrerApplicationDto } from './dto/create-referrer-application.dto';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';

@Controller('referrer')
export class ClientReferrerController {
  constructor(private readonly referrerService: ClientReferrerService) {}

  @Post('apply')
  async apply(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReferrerApplicationDto,
  ) {
    return await this.referrerService.apply(userId, dto);
  }

  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    return await this.referrerService.getStatus(userId);
  }

  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    return await this.referrerService.getMe(userId);
  }

  @Get('contract/preview')
  async getContractPreview(@CurrentUser('id') userId: string) {
    return await this.referrerService.getContractPreview(userId);
  }

  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('docType') docType?: string,
    @Body('name') name?: string,
  ) {
    return await this.referrerService.uploadDocument(
      userId,
      file,
      docType || 'OTHER',
      name,
    );
  }
}
