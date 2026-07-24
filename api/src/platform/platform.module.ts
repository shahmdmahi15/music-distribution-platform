import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { PlatformMiddleware } from './platform.middleware';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ClientModule } from './client/client.module';

@Module({
  imports: [
    AuthModule,
    AdminModule,
    ClientModule,
    RouterModule.register([
      {
        path: 'platform',
        children: [
          { path: '', module: AuthModule },
          { path: '', module: AdminModule },
          { path: '', module: ClientModule },
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
