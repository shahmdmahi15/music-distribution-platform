import { Module } from '@nestjs/common';
import { WhitelabelSessionAuthService } from './whitelabel-session-auth.service';
import { WhitelabelSessionService } from './whitelabel-session.service';
import { WhitelabelSessionController } from './whitelabel-session.controller';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { StorageModule } from 'src/lib/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [WhitelabelSessionController],
  providers: [WhitelabelSessionAuthService, WhitelabelSessionService],
  exports: [WhitelabelSessionAuthService, WhitelabelSessionService],
})
export class WhitelabelSessionModule {}
