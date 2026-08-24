import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { PlatformMiddleware } from './platform.middleware';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ClientModule } from './client/client.module';
import { ProfileModule as AdminProfileModule } from './admin/profile/profile.module';
import { SessionModule as AdminSessionModule } from './admin/session/session.module';
import { PlatformUsersModule as AdminPlatformUsersModule } from './admin/platform-users/platform-users.module';
import { WhitelabelUsersModule as AdminWhitelabelUsersModule } from './admin/whitelabel-users/whitelabel-users.module';
import { AdminWhitelabelModule } from './admin/whitelabel/whitelabel.module';
import { ProfileModule as ClientProfileModule } from './client/profile/profile.module';
import { SessionModule as ClientSessionModule } from './client/session/session.module';
import { SubscriptionModule as ClientSubscriptionModule } from './client/subscription/subscription.module';
import { ClientWhitelabelModule } from './client/whitelabel/whitelabel.module';

@Module({
  imports: [
    AuthModule,
    AdminModule,
    ClientModule,
    RouterModule.register([
      {
        path: 'platform',
        children: [
          {
            path: '',
            module: AuthModule,
          },
          {
            path: 'admin',
            children: [
              {
                path: '',
                module: AdminProfileModule,
              },
              {
                path: '',
                module: AdminSessionModule,
              },
              {
                path: '',
                module: AdminPlatformUsersModule,
              },
              {
                path: '',
                module: AdminWhitelabelUsersModule,
              },
              {
                path: '',
                module: AdminWhitelabelModule,
              },
            ],
          },
          {
            path: 'client',
            children: [
              {
                path: '',
                module: ClientProfileModule,
              },
              {
                path: '',
                module: ClientSessionModule,
              },
              {
                path: '',
                module: ClientSubscriptionModule,
              },
              {
                path: '',
                module: ClientWhitelabelModule,
              },
            ],
          },
        ],
      },
    ]),
  ],
})
export class PlatformModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PlatformMiddleware).forRoutes('platform/*path');
  }
}
