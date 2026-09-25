import { Module } from '@nestjs/common';
import { ClientWhitelabelController } from './whitelabel.controller';
import { ClientWhitelabelService } from './whitelabel.service';
import { WhitelabelProvisioningService } from './provisioning/whitelabel-provisioning.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { RedisModule } from 'src/lib/redis/redis.module';
import { StorageModule } from 'src/lib/storage/storage.module';
import { CloudflareDnsModule } from 'src/lib/cloudflare/cloudflare-dns.module';

@Module({
  imports: [PrismaModule, RedisModule, StorageModule, CloudflareDnsModule],
  controllers: [ClientWhitelabelController],
  providers: [ClientWhitelabelService, WhitelabelProvisioningService],
  exports: [ClientWhitelabelService, WhitelabelProvisioningService],
})
export class ClientWhitelabelModule {}
