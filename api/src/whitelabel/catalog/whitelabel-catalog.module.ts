import { Module } from '@nestjs/common';
import { WhitelabelCatalogController } from './whitelabel-catalog.controller';
import { WhitelabelCatalogService } from './whitelabel-catalog.service';
import { WhitelabelQcValidationService } from './validation/whitelabel-qc-validation.service';
import { WhitelabelSessionModule } from '../session/whitelabel-session.module';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { StorageModule } from 'src/lib/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule, WhitelabelSessionModule],
  controllers: [WhitelabelCatalogController],
  providers: [WhitelabelCatalogService, WhitelabelQcValidationService],
  exports: [WhitelabelCatalogService, WhitelabelQcValidationService],
})
export class WhitelabelCatalogModule {}
