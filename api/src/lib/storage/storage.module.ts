import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { R2StorageService } from './r2-storage.service';
import { MediaController } from './media.controller';

@Global()
@Module({
  controllers: [MediaController],
  providers: [StorageService, R2StorageService],
  exports: [StorageService, R2StorageService],
})
export class StorageModule {}
