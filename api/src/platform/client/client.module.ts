import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ClientMiddleware } from './client.middleware';
import { ProfileModule } from './profile/profile.module';
import { SessionModule } from './session/session.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ClientWhitelabelModule } from './whitelabel/whitelabel.module';
import { ClientReferrerModule } from './referrer/referrer.module';
import { ClientCatalogModule } from './catalog/client-catalog.module';

@Module({
  imports: [
    ProfileModule,
    SessionModule,
    SubscriptionModule,
    ClientWhitelabelModule,
    ClientReferrerModule,
    ClientCatalogModule,
  ],
  exports: [ClientCatalogModule],
})
export class ClientModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ClientMiddleware)
      .exclude('platform/client/whitelabel/bundle/download')
      .forRoutes('platform/client/*path');
  }
}
