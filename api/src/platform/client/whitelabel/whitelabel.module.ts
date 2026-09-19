import { Module } from '@nestjs/common';
import { ClientWhitelabelController } from './whitelabel.controller';
import { ClientWhitelabelService } from './whitelabel.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { RedisModule } from 'src/lib/redis/redis.module';
import { StorageModule } from 'src/lib/storage/storage.module';

@Module({
  imports: [PrismaModule, RedisModule, StorageModule],
  controllers: [ClientWhitelabelController],
  providers: [ClientWhitelabelService],
  exports: [ClientWhitelabelService],
})
export class ClientWhitelabelModule {}

