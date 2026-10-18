import { Module } from '@nestjs/common';
import { ClientCatalogController } from './client-catalog.controller';
import { ClientCatalogService } from './client-catalog.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { StorageModule } from 'src/lib/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ClientCatalogController],
  providers: [ClientCatalogService],
  exports: [ClientCatalogService],
})
export class ClientCatalogModule {}
