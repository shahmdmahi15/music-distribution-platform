import { Module } from '@nestjs/common';
import { AdminWhitelabelController } from './whitelabel.controller';
import { AdminWhitelabelService } from './whitelabel.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { RedisModule } from 'src/lib/redis/redis.module';
import { ClientWhitelabelModule } from 'src/platform/client/whitelabel/whitelabel.module';

@Module({
  imports: [PrismaModule, RedisModule, ClientWhitelabelModule],
  controllers: [AdminWhitelabelController],
  providers: [AdminWhitelabelService],
  exports: [AdminWhitelabelService],
})
export class AdminWhitelabelModule {}
