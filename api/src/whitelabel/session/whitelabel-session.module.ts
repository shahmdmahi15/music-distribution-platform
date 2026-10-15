import { Global, Module } from '@nestjs/common';
import { WhitelabelSessionAuthService } from './whitelabel-session-auth.service';
import { WhitelabelSessionService } from './whitelabel-session.service';
import { WhitelabelSessionController } from './whitelabel-session.controller';
import { WhitelabelSessionGuard } from '../guard/whitelabel-session.guard';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { StorageModule } from 'src/lib/storage/storage.module';

@Global()
@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [WhitelabelSessionController],
  providers: [
    WhitelabelSessionAuthService,
    WhitelabelSessionService,
    WhitelabelSessionGuard,
  ],
  exports: [
    WhitelabelSessionAuthService,
    WhitelabelSessionService,
    WhitelabelSessionGuard,
  ],
})
export class WhitelabelSessionModule {}
