import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ClientMiddleware } from './client.middleware';
import { ProfileModule } from './profile/profile.module';
import { SessionModule } from './session/session.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [ProfileModule, SessionModule, SubscriptionModule],
})
export class ClientModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ClientMiddleware).forRoutes('platform/client/*path');
  }
}
