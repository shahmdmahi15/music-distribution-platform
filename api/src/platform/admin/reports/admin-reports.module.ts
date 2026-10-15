import { Module } from '@nestjs/common';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
import { DspReportIngestionService } from './dsp-report-ingestion.service';
import { RoyaltyRunService } from './royalty-run.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { StorageModule } from 'src/lib/storage/storage.module';
import { WhitelabelContractsModule } from 'src/whitelabel/contracts/whitelabel-contracts.module';

@Module({
  imports: [PrismaModule, StorageModule, WhitelabelContractsModule],
  controllers: [AdminReportsController],
  providers: [
    AdminReportsService,
    DspReportIngestionService,
    RoyaltyRunService,
  ],
  exports: [
    AdminReportsService,
    DspReportIngestionService,
    RoyaltyRunService,
  ],
})
export class AdminReportsModule {}
