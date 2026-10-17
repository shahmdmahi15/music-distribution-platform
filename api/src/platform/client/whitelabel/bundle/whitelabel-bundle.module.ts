import { Module } from '@nestjs/common';
import { WhitelabelBundleService } from './whitelabel-bundle.service';
import { RedisModule } from 'src/lib/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [WhitelabelBundleService],
  exports: [WhitelabelBundleService],
})
export class WhitelabelBundleModule {}
