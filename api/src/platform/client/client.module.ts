import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { ClientMiddleware } from './client.middleware';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    ProfileModule,
    RouterModule.register([
      {
        path: 'admin',
        children: [{ path: '', module: ProfileModule }],
      },
    ]),
  ],
})
export class ClientModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ClientMiddleware).forRoutes('client/*path');
  }
}
