import { Module } from '@nestjs/common';
import { AdminDistributionController } from './admin-distribution.controller';
import { AdminDistributionService } from './admin-distribution.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { StorageModule } from 'src/lib/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [AdminDistributionController],
  providers: [AdminDistributionService],
  exports: [AdminDistributionService],
})
export class AdminDistributionModule {}
