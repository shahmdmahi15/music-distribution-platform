import { Global, Module } from '@nestjs/common';
import { CloudflareDnsService } from './cloudflare-dns.service';

@Global()
@Module({
  providers: [CloudflareDnsService],
  exports: [CloudflareDnsService],
})
export class CloudflareDnsModule {}
