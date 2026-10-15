import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WhitelabelMiddleware } from './whitelabel.middleware';
import { WhitelabelTenantModule } from './tenant/whitelabel-tenant.module';
import { WhitelabelAuthModule } from './auth/whitelabel-auth.module';
import { WhitelabelSessionModule } from './session/whitelabel-session.module';
import { WhitelabelUsersModule } from './users/whitelabel-users.module';
import { WhitelabelCatalogModule } from './catalog/whitelabel-catalog.module';
import { WhitelabelReportsModule } from './reports/whitelabel-reports.module';
import { WhitelabelContractsModule } from './contracts/whitelabel-contracts.module';
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
    WhitelabelCatalogModule,
    WhitelabelReportsModule,
    WhitelabelContractsModule,

    RouterModule.register([
      {
        path: 'whitelabel',
        children: [
          WhitelabelTenantModule,
          WhitelabelAuthModule,
          WhitelabelSessionModule,
          WhitelabelUsersModule,
          WhitelabelCatalogModule,
          WhitelabelReportsModule,
          WhitelabelContractsModule,
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
    WhitelabelCatalogModule,
    WhitelabelReportsModule,
    WhitelabelContractsModule,
  ],
})
export class WhitelabelModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(WhitelabelMiddleware)
      .exclude('whitelabel/tenant/resolve-subdomain')
      .forRoutes('whitelabel/*path');
  }
}
