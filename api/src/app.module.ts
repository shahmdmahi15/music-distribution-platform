import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Request } from 'express';
import { validateEnv } from './config/env.config';
import { resolveClientIp } from './lib/client-ip/client-ip.util';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './lib/prisma/prisma.module';
import { RedisModule } from './lib/redis/redis.module';
import { MailModule } from './lib/mail/mail.module';
import { StorageModule } from './lib/storage/storage.module';
import { PlatformModule } from './platform/platform.module';
import { SessionModule } from './platform/session/session.module';
import { WhitelabelModule } from './whitelabel/whitelabel.module';
import { CloudflareDnsModule } from './lib/cloudflare/cloudflare-dns.module';
import { RolesGuard } from './platform/guard/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
      // The socket peer is always the platform server, so the tracker has to be
      // the secret-validated forwarded address rather than `req.ip`.
      getTracker: (req) => resolveClientIp(req as Request),
    }),
    PrismaModule,
    RedisModule,
    MailModule,
    StorageModule,
    CloudflareDnsModule,
    SessionModule,
    PlatformModule,
    WhitelabelModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
