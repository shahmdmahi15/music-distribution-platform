import { Module } from '@nestjs/common';
import { WhitelabelTenantController } from './whitelabel-tenant.controller';
import { WhitelabelTenantService } from './whitelabel-tenant.service';
import { StorageModule } from 'src/lib/storage/storage.module';
import { RedisModule } from 'src/lib/redis/redis.module';

@Module({
  imports: [StorageModule, RedisModule],
  controllers: [WhitelabelTenantController],
  providers: [WhitelabelTenantService],
  exports: [WhitelabelTenantService],
})
export class WhitelabelTenantModule {}

