import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WhitelabelMiddleware } from './whitelabel.middleware';
import { WhitelabelTenantModule } from './tenant/whitelabel-tenant.module';
import { WhitelabelAuthModule } from './auth/whitelabel-auth.module';
import { WhitelabelSessionModule } from './session/whitelabel-session.module';
import { WhitelabelUsersModule } from './users/whitelabel-users.module';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { RedisModule } from 'src/lib/redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    WhitelabelTenantModule,
    WhitelabelAuthModule,
    WhitelabelSessionModule,
    WhitelabelUsersModule,

    RouterModule.register([
      {
        path: 'whitelabel',
        children: [
          WhitelabelTenantModule,
          WhitelabelAuthModule,
          WhitelabelSessionModule,
          WhitelabelUsersModule,
        ],
      },
    ]),
  ],
  providers: [WhitelabelMiddleware],
  exports: [
    WhitelabelTenantModule,
    WhitelabelAuthModule,
    WhitelabelSessionModule,
    WhitelabelUsersModule,
  ],
})
export class WhitelabelModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(WhitelabelMiddleware).forRoutes('whitelabel/*path');
  }
}
