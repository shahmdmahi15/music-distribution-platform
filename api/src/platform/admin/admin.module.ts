import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AdminMiddleware } from './admin.middleware';
import { UsersModule } from './users/users.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    UsersModule,
    ProfileModule,
    RouterModule.register([
      {
        path: 'admin',
        children: [
          { path: '', module: UsersModule },
          { path: '', module: ProfileModule },
        ],
      },
    ]),
  ],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AdminMiddleware).forRoutes('admin/*path');
  }
}
