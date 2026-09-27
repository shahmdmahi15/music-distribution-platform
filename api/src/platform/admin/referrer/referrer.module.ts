import { Module } from '@nestjs/common';
import { AdminReferrerController } from './referrer.controller';
import { AdminReferrerService } from './referrer.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { StorageModule } from 'src/lib/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [AdminReferrerController],
  providers: [AdminReferrerService],
  exports: [AdminReferrerService],
})
export class AdminReferrerModule {}
