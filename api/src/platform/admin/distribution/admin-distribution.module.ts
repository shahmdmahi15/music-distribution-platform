import { Module } from '@nestjs/common';
import { AdminDistributionController } from './admin-distribution.controller';
import { AdminDistributionService } from './admin-distribution.service';
import { AnsDispatchService } from './ans-dispatch.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { StorageModule } from 'src/lib/storage/storage.module';
import { DdexModule } from 'src/lib/ddex/ddex.module';
import { AnsMusicModule } from 'src/lib/ans-music/ans-music.module';

@Module({
  imports: [PrismaModule, StorageModule, DdexModule, AnsMusicModule],
  controllers: [AdminDistributionController],
  providers: [AdminDistributionService, AnsDispatchService],
  exports: [AdminDistributionService, AnsDispatchService],
})
export class AdminDistributionModule {}
