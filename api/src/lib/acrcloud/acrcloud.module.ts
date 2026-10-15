import { Global, Module } from '@nestjs/common';
import { AcrCloudService } from './acrcloud.service';

@Global()
@Module({
  providers: [AcrCloudService],
  exports: [AcrCloudService],
})
export class AcrCloudModule {}
