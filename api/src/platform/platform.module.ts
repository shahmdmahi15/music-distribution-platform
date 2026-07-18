import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PlatformMiddleware } from './platform.middleware';

@Module({
  imports: [
    UserModule,
    AuthModule,
    RouterModule.register([
      {
        path: 'platform',
        children: [
          { path: '', module: UserModule },
          { path: '', module: AuthModule },
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
