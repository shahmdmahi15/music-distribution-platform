import { Module } from '@nestjs/common';
import { AdminInfrastructureController } from './admin-infrastructure.controller';
import { AdminInfrastructureService } from './admin-infrastructure.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { MailModule } from 'src/lib/mail/mail.module';
import { StorageModule } from 'src/lib/storage/storage.module';

@Module({
  imports: [PrismaModule, MailModule, StorageModule],
  controllers: [AdminInfrastructureController],
  providers: [AdminInfrastructureService],
  exports: [AdminInfrastructureService],
})
export class AdminInfrastructureModule {}
