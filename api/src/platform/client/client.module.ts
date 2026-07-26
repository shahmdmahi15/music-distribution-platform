import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ClientMiddleware } from './client.middleware';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [ProfileModule],
})
export class ClientModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ClientMiddleware).forRoutes('platform/client/*path');
  }
}
