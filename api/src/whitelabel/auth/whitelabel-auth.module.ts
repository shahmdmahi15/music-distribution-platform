import { Module } from '@nestjs/common';
import { WhitelabelAuthController } from './whitelabel-auth.controller';
import { WhitelabelAuthService } from './whitelabel-auth.service';
import { WhitelabelSessionModule } from '../session/whitelabel-session.module';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { RedisModule } from 'src/lib/redis/redis.module';
import { MailModule } from 'src/lib/mail/mail.module';
import { StorageModule } from 'src/lib/storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    MailModule,
    StorageModule,
    WhitelabelSessionModule,
  ],
  controllers: [WhitelabelAuthController],
  providers: [WhitelabelAuthService],
  exports: [WhitelabelAuthService],
})
export class WhitelabelAuthModule {}
