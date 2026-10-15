import { Module } from '@nestjs/common';
import { WhitelabelReportsController } from './whitelabel-reports.controller';
import { WhitelabelReportsService } from './whitelabel-reports.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { StorageModule } from 'src/lib/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [WhitelabelReportsController],
  providers: [WhitelabelReportsService],
  exports: [WhitelabelReportsService],
})
export class WhitelabelReportsModule {}
