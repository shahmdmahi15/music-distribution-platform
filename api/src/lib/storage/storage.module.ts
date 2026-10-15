import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { R2StorageService } from './r2-storage.service';

@Global()
@Module({
  providers: [StorageService, R2StorageService],
  exports: [StorageService, R2StorageService],
})
export class StorageModule {}
