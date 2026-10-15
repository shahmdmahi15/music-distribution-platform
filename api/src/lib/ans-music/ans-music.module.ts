import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnsMusicConfigService } from './ans-music.config';
import { AnsMusicClientService } from './ans-music-client.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AnsMusicConfigService, AnsMusicClientService],
  exports: [AnsMusicConfigService, AnsMusicClientService],
})
export class AnsMusicModule {}
