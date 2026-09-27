import { Module } from '@nestjs/common';
import { ClientReferrerController } from './referrer.controller';
import { ClientReferrerService } from './referrer.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { StorageModule } from 'src/lib/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ClientReferrerController],
  providers: [ClientReferrerService],
  exports: [ClientReferrerService],
})
export class ClientReferrerModule {}
