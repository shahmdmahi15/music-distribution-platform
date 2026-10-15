import { Global, Module } from '@nestjs/common';
import { CloudflareDnsService } from './cloudflare-dns.service';
import { CloudflareSaasService } from './cloudflare-saas.service';

@Global()
@Module({
  providers: [CloudflareDnsService, CloudflareSaasService],
  exports: [CloudflareDnsService, CloudflareSaasService],
})
export class CloudflareDnsModule {}
