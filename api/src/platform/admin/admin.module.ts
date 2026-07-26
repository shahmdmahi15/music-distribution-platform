import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AdminMiddleware } from './admin.middleware';
import { ProfileModule } from './profile/profile.module';
import { PlatformUsersModule } from './platform-users/platform-users.module';
import { WhitelabelUsersModule } from './whitelabel-users/whitelabel-users.module';

@Module({
  imports: [ProfileModule, PlatformUsersModule, WhitelabelUsersModule],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AdminMiddleware).forRoutes('platform/admin/*path');
  }
}
