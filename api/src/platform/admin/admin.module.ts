import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AdminMiddleware } from './admin.middleware';
import { ProfileModule } from './profile/profile.module';
import { PlatformUsersModule } from './platform-users/platform-users.module';
import { SessionModule } from './session/session.module';
import { AdminWhitelabelModule } from './whitelabel/whitelabel.module';
import { AdminReferrerModule } from './referrer/referrer.module';
import { AdminDistributionModule } from './distribution/admin-distribution.module';
import { AdminReportsModule } from './reports/admin-reports.module';

@Module({
  imports: [
    ProfileModule,
    PlatformUsersModule,
    SessionModule,
    AdminWhitelabelModule,
    AdminReferrerModule,
    AdminDistributionModule,
    AdminReportsModule,
  ],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AdminMiddleware).forRoutes('platform/admin/*path');
  }
}
