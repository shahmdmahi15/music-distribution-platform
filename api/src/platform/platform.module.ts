import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { PlatformMiddleware } from './platform.middleware';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ClientModule } from './client/client.module';
import { ProfileModule as AdminProfileModule } from './admin/profile/profile.module';
import { PlatformUsersModule as AdminPlatformUsersModule } from './admin/platform-users/platform-users.module';
import { WhitelabelUsersModule as AdminWhitelabelUsersModule } from './admin/whitelabel-users/whitelabel-users.module';
import { ProfileModule as ClientProfileModule } from './client/profile/profile.module';

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
                module: AdminPlatformUsersModule,
              },
              {
                path: '',
                module: AdminWhitelabelUsersModule,
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
